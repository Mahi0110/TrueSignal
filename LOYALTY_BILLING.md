# Creator Pass loyalty billing (web)

Implemented as an opt-in Stripe Billing checkout with RevenueCat entitlement synchronization. Native Apple/Google subscriptions keep their existing store pricing. This code does not automatically configure, deploy, or activate any payment account.

## Pricing policy

- One monthly recurring price, quantity one, without a trial. The amount and currency come from the configured Stripe price; ₹500 is an example, not a hardcoded charge.
- After the initial paid period, apply a 5% coupon to the next renewal. After subsequent paid periods: 10%, 15%, then 20% indefinitely.
- Each new subscription starts with no subscription discount. Its first payment earns 5% off its next renewal. History from an expired subscription never carries over.
- Turning off auto-renewal keeps access through the paid period. Resuming before expiration preserves the discount. A failed payment does not advance the discount; recovery before the subscription ends preserves its history.
- Only paid positive-value invoices for this exact price, one non-prorated recurring line, and billing reasons `subscription_create` or `subscription_cycle` qualify. Free trials, zero-value invoices, credits-only periods, add-ons, annual plans, manual adjustments and prorations do not earn a step.
- Refunds do not automatically reverse earned steps in this version; review refunds/disputes operationally and configure access in RevenueCat/Stripe. Paused subscriptions and plan switching are not supported by this offer.
- No promotion-code entry, price selection, or user ID is accepted from the browser. The backend owns the discount list. Do not manually attach extra customer/subscription coupons or change this product's price; doing so bypasses the pricing contract.

## Architecture

`CreatorPass → authenticated creator-billing → Stripe Checkout → signed Stripe webhook → paid-period ledger → next-renewal coupon → RevenueCat receipt import`

`creator-billing` verifies the bearer token with Supabase Auth `/user`. Status reads RevenueCat, not URL parameters or browser state. Existing web subscribers use the Stripe Customer Portal. Existing mobile subscribers cannot buy a duplicate web pass.

`stripe-loyalty-webhook` verifies Stripe's HMAC over the raw body, including timestamp tolerance, and re-reads the current subscription and paid invoices from Stripe. It never trusts the event's stale subscription state or client-supplied IDs. Invoice/period uniqueness prevents duplicate progression; backend-only leases serialize account checkout and subscription updates. Ledger writes precede Stripe updates, so retries recover from partial failures. The discount update uses an idempotency key, keeps the billing anchor, and disables proration. Updating a discount does not change the already-paid invoice.

Leases last ten minutes, longer than the hosted Edge Function maximum execution time. A worker killed mid-request temporarily blocks concurrent work until the lease expires. Stripe receives a retryable non-2xx response on failure. Keep this execution-time assumption if moving the service to a different host.

## Configure in a sandbox first

1. In Stripe **Sandbox**, create one Creator Pass monthly recurring flat-rate price. For the example, use INR 500.00. Copy its `price_...` ID.
2. Create four percentage coupons: 5%, 10%, 15%, and 20%. Each must have duration **forever**, no redemption limit or expiration, and either apply to all products or include this product. Keep the coupon IDs private to server configuration so checkout always starts at full price.
3. Create a Stripe Customer Portal configuration. Enable payment-method updates, invoice history, and cancellation **at the end of the billing period**. Disable subscription plan/quantity updates. Copy its `bpc_...` ID. Configure your actual business/support/terms/privacy information in Stripe before release.
4. Connect this Stripe sandbox to RevenueCat using its **Stripe Billing** integration (not the separate RevenueCat Billing engine). Import the base product, attach it to `creator_pass`, and choose purchase recognition **after the invoice is paid**. Obtain the public SDK key belonging to that **Stripe config**. Configure Stripe server notifications in RevenueCat for ongoing lifecycle updates. The app uses the authenticated Supabase UUID as `app_user_id` and manually imports verified subscriptions.
5. Apply only `supabase/migrations/20260919083359_loyalty_billing.sql` to the intended staging Supabase project, after the existing application migrations. The repository's historical migration versions differ from production history; do not blindly push all old migrations again. The new tables have RLS and no anonymous/authenticated read/write grants; only service_role uses them.
6. Set the following **server-only Edge Function secrets**. Supabase supplies `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` in its hosted runtime. Never put service or Stripe secret keys in Expo's public `.env`.

| Secret | Value |
|---|---|
| `BILLING_ENABLED` | `true` after sandbox configuration |
| `BILLING_ALLOWED_ORIGINS` | Exact comma-separated origins, e.g. `http://localhost:8082,https://truesignal.mahi00022.chatgpt.site` |
| `STRIPE_MODE` | `test` for sandbox; deliberately change to `live` only after verification |
| `STRIPE_SECRET_KEY` | Key for the same Stripe sandbox |
| `STRIPE_PRICE_ID` | Monthly base price ID |
| `STRIPE_LOYALTY_COUPON_5` | 5% coupon ID |
| `STRIPE_LOYALTY_COUPON_10` | 10% coupon ID |
| `STRIPE_LOYALTY_COUPON_15` | 15% coupon ID |
| `STRIPE_LOYALTY_COUPON_20` | 20% coupon ID |
| `STRIPE_PORTAL_CONFIGURATION_ID` | Portal configuration from step 3 |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook endpoint below |
| `REVENUECAT_STRIPE_PUBLIC_KEY` | SDK public key for the connected Stripe config |
| `REVENUECAT_ENTITLEMENT` | `creator_pass` (default) |

7. Deploy `creator-billing` and `stripe-loyalty-webhook` using Supabase Edge Functions. The checked-in `supabase/config.toml` disables gateway JWT checking for these two functions: `creator-billing` explicitly validates Supabase Auth, and the webhook explicitly validates Stripe signatures.
8. Add a Stripe webhook endpoint at `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-loyalty-webhook`. Subscribe to `invoice.paid`, `invoice.upcoming`, `customer.subscription.updated`, and `customer.subscription.deleted`. Use Stripe API version `2025-06-30.basil` (also pinned by our REST client). Set its signing secret above. Keep RevenueCat's own Stripe notification endpoint too.
9. In the Expo application's `.env`, set `EXPO_PUBLIC_WEB_BILLING_ENABLED=true`, then restart/rebuild the web app. The default is false. Sign in and open Creator Pass. The Upgrade button opens Stripe-hosted Checkout; the existing native RevenueCat-designed paywall is not rendered by this web flow.
10. Return from checkout and press **Refresh access** after webhook delivery. The app also refreshes when it mounts or returns to the foreground. Cancellation uses **Manage subscription**. The ladder and next renewal come from the backend's configured Stripe base price and applied loyalty tier; displayed amounts exclude any applicable taxes. Configure tax collection and receipts in Stripe to match your business requirements.

## Required sandbox verification

- First checkout bills the configured full price; repeated clicks reuse the pending checkout, and an existing subscription prevents a second one.
- First four successful periods yield next-invoice prices of 95%, 90%, 85%, and 80%; later renewals stay at 80%. Inspect actual Stripe invoices and coupon assignments, not just UI labels.
- Replay signed webhooks, reorder them, and simulate transient Stripe/RevenueCat errors. Each paid period earns a step exactly once and imports retry safely.
- Fail a payment, recover it, and verify no extra step is granted for failed retries. Check that unrelated products and proration invoices are ignored.
- Cancel at period end, resume before expiry, and confirm the tier remains. Let the subscription fully expire, then resubscribe and confirm full price returns.
- Complete checkout on one account, switch accounts, and verify Creator Pass does not carry over. Test unauthorized calls, an unlisted origin, and a forged webhook.
- Check expiration and cancellation on both the web and native app using the same user ID. Stripe Test Clocks can test Stripe's ladder but RevenueCat uses real time; do not treat a time-travel result as end-to-end entitlement verification.
- Monitor webhook delivery failures. `invoice.upcoming` reconciles missing paid-period events before renewal. A prolonged outage can still leave an invoice at the previous price; reconcile and correct the charge before considering a release complete. This is a release gate, not proof of live billing readiness.

## Validation performed in code

`npm run check` includes app/Edge Function type checking, mocked external-service billing integration tests, signature verification, retry/order/expiry tests, and real PGlite SQL permission/uniqueness/locking tests. `npm run build:web` verifies the Expo web bundle. These do not replace real sandbox checkout, deployment, browser QA, or provider configuration.

## References

- https://docs.stripe.com/billing/subscriptions/webhooks
- https://docs.stripe.com/api/subscriptions/update
- https://supabase.com/docs/guides/functions/examples/stripe-webhooks
- https://www.revenuecat.com/docs/web/integrations/stripe
- https://www.revenuecat.com/docs/web/integrations/stripe/track-external-purchases
