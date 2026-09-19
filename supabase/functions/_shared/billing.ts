import { POLICY, STEPS, discountForPayments, discountedAmount, objectId, subscriptionId,
  qualifyingPeriod, isOpenSubscription, ownsLoyaltySubscription, verifySignature } from "./loyalty.ts";

type Env = (key: string) => string | undefined;
type Transport = typeof fetch;
class BillingError extends Error {
  readonly status: number;
  constructor(message: string, status = 503) { super(message); this.status = status; }
}
export function createBilling(env: Env, transport: Transport = fetch) {
  const required = (key: string) => {
    const value = env(key);
    if (!value) throw new BillingError("Web billing is not configured yet.");
    return value;
  };
  async function request(url: string, init: RequestInit = {}) {
    const response = await transport(url, { ...init, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new BillingError("Billing could not be verified. Please try again.");
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  const db = (path: string, method = "GET", body?: unknown, extra = {}) => request(
    `${required("SUPABASE_URL")}/rest/v1/${path}`, {
      method, headers: { apikey: required("SUPABASE_SERVICE_ROLE_KEY"),
        Authorization: `Bearer ${required("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json", ...extra },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const stripe = (path: string, method = "GET", params?: Record<string, string>, idempotency?: string) => request(
    `https://api.stripe.com/v1/${path}`, {
      method, headers: { Authorization: `Bearer ${required("STRIPE_SECRET_KEY")}`,
        "Stripe-Version": "2025-06-30.basil", "Content-Type": "application/x-www-form-urlencoded",
        ...(idempotency ? { "Idempotency-Key": idempotency } : {}) },
      ...(params ? { body: new URLSearchParams(params).toString() } : {}),
    });
  async function locked<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const token = crypto.randomUUID();
    const acquired = await db("rpc/billing_claim_lock", "POST", { lock_name: name, owner: token });
    if (!acquired) throw new BillingError("Billing is updating. Please try again shortly.", 409);
    try { return await fn(); }
    finally { await db("rpc/billing_release_lock", "POST", { lock_name: name, owner: token }); }
  }
  async function account(userId: string, create = false) {
    if (create) await db("billing_accounts?on_conflict=user_id", "POST", { user_id: userId }, { Prefer: "resolution=ignore-duplicates" });
    return (await db(`billing_accounts?user_id=eq.${encodeURIComponent(userId)}&select=*`))[0];
  }
  async function price() {
    const p = await stripe(`prices/${encodeURIComponent(required("STRIPE_PRICE_ID"))}`);
    const mode = required("STRIPE_MODE");
    if (!["test", "live"].includes(mode) || p.livemode !== (mode === "live") || !p.active ||
        p.type !== "recurring" || p.recurring?.interval !== "month" || p.recurring.interval_count !== 1 ||
        p.recurring.usage_type !== "licensed" || !Number.isSafeInteger(p.unit_amount) || p.unit_amount <= 0)
      throw new BillingError("The monthly billing plan needs configuration.");
    return p;
  }
  async function validateCoupons(p: any) {
    for (const percent of STEPS.slice(1)) {
      const coupon = await stripe(`coupons/${encodeURIComponent(required(`STRIPE_LOYALTY_COUPON_${percent}`))}`);
      if (!coupon.valid || coupon.duration !== "forever" || coupon.percent_off !== percent ||
          (coupon.applies_to?.products && !coupon.applies_to.products.includes(objectId(p.product))))
        throw new BillingError("Loyalty discounts need configuration.");
    }
  }
  async function subscriptions(customerId: string) {
    const result = await stripe(`subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=100`);
    if (result.has_more) throw new BillingError("Please contact support to review your subscriptions.");
    return result.data;
  }
  async function rc(userId: string, subId?: string) {
    const headers = { Authorization: `Bearer ${required("REVENUECAT_STRIPE_PUBLIC_KEY")}`,
      "Content-Type": "application/json", "X-Platform": "stripe" };
    if (!subId) {
      const response = await transport(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, { headers, signal: AbortSignal.timeout(15000) });
      if (response.status === 404) return { subscriber: { entitlements: {} } };
      if (!response.ok) throw new BillingError("Subscription access could not be verified.");
      return response.json();
    }
    return request("https://api.revenuecat.com/v1/receipts", { method: "POST", headers,
          body: JSON.stringify({ app_user_id: userId, fetch_token: subId }) });
  }
  async function reconcile(subId: string) {
    return locked(`subscription:${subId}`, async () => {
      const sub = await stripe(`subscriptions/${encodeURIComponent(subId)}`);
      const uid = sub.metadata?.app_user_id;
      if (sub.metadata?.loyalty_policy !== POLICY || !uid) return;
      const a = await account(uid);
      if (!a || a.user_id !== uid || !ownsLoyaltySubscription(sub, uid, a.customer_id, required("STRIPE_PRICE_ID")))
        throw new BillingError("Subscription ownership or plan mismatch.");
      if (sub.livemode !== (required("STRIPE_MODE") === "live")) throw new BillingError("Billing mode mismatch.");
      // Re-read Stripe, not the possibly stale event payload. Canceled subscriptions never advance.
      if (isOpenSubscription(sub)) {
        let after = "";
        const recorded = await db(`billing_paid_periods?subscription_id=eq.${encodeURIComponent(subId)}&select=invoice_id&limit=4`);
        for (let page = 0; recorded.length < 4 && page < 10; page++) {
          const invoices = await stripe(`invoices?subscription=${encodeURIComponent(subId)}&status=paid&limit=100${after}`);
          const rows = invoices.data.flatMap((invoice: any) => {
            const period = qualifyingPeriod(invoice, subId, required("STRIPE_PRICE_ID"));
            return period ? [{ subscription_id: subId, period_start: period.start, period_end: period.end,
              invoice_id: invoice.id, user_id: uid }] : [];
          });
          if (rows.length) await db("billing_paid_periods?on_conflict=subscription_id,period_start", "POST", rows,
            { Prefer: "resolution=ignore-duplicates" });
          const periods = await db(`billing_paid_periods?subscription_id=eq.${encodeURIComponent(subId)}&select=invoice_id&limit=4`);
          if (periods.length >= 4 || !invoices.has_more) break;
          if (page === 9) throw new BillingError("Invoice history needs manual reconciliation.");
          after = `&starting_after=${encodeURIComponent(invoices.data.at(-1).id)}`;
        }
        const periods = await db(`billing_paid_periods?subscription_id=eq.${encodeURIComponent(subId)}&select=invoice_id&limit=4`);
        const percent = discountForPayments(periods.length);
        if (percent > 0 && Number(sub.metadata?.loyalty_percent || 0) !== percent) {
          const p = await price();
          await validateCoupons(p);
          const coupon = required(`STRIPE_LOYALTY_COUPON_${percent}`);
          // This plan owns its subscription discounts; other discount stacking is intentionally unsupported.
          await stripe(`subscriptions/${encodeURIComponent(subId)}`, "POST", {
            "discounts[0][coupon]": coupon, proration_behavior: "none",
            "metadata[loyalty_percent]": String(percent),
          }, `loyalty:${subId}:${percent}`);
        }
      }
      // Retrying this import is safe and also refreshes cancellation/expiry in RevenueCat.
      await rc(uid, subId);
    });
  }
  function enabled() {
    if (env("BILLING_ENABLED") !== "true") throw new BillingError("Web subscriptions are not available yet.");
  }
  function allowedOrigin(req: Request) {
    const origin = req.headers.get("Origin");
    const allowed = required("BILLING_ALLOWED_ORIGINS").split(",").map((v) => v.trim());
    return origin && allowed.includes(origin) ? origin : null;
  }
  async function app(req: Request) {
    let headers: Record<string, string> = {};
    try {
      const origin = allowedOrigin(req);
      if (!origin) throw new BillingError("This origin is not allowed.", 403);
      headers = { "Access-Control-Allow-Origin": origin, Vary: "Origin",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS", "Cache-Control": "no-store" };
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
      if (req.method !== "POST") throw new BillingError("Use POST.", 405);
      enabled();
      const authorization = req.headers.get("Authorization") ?? "";
      if (!authorization.startsWith("Bearer ")) throw new BillingError("Sign in to continue.", 401);
      const auth = await transport(`${required("SUPABASE_URL")}/auth/v1/user`, {
        headers: { Authorization: authorization, apikey: required("SUPABASE_ANON_KEY") }, signal: AbortSignal.timeout(15000),
      });
      if (!auth.ok) throw new BillingError("Sign in to continue.", 401);
      const user = await auth.json();
      if (!user.id || user.is_anonymous) throw new BillingError("Sign in to continue.", 401);
      const body = await req.json();
      if (!["status", "checkout", "portal"].includes(body.action)) throw new BillingError("Unknown billing action.", 400);
      const p = await price();
      const result = await locked(`account:${user.id}`, async () => {
        const a = await account(user.id, true);
        const subs = a.customer_id ? await subscriptions(a.customer_id) : [];
        const open = subs.filter(isOpenSubscription);
        if (body.action === "status") {
          const managed = open.find((s: any) => ownsLoyaltySubscription(s, user.id, a.customer_id, p.id));
          const customer = await rc(user.id);
          const entitlement = customer.subscriber?.entitlements?.[env("REVENUECAT_ENTITLEMENT") || "creator_pass"];
          const expires = entitlement?.expires_date;
          const active = !!entitlement && (expires === null || Date.parse(expires) > Date.now());
          const percent = managed ? Number(managed.metadata?.loyalty_percent || 0) : 0;
          return { active, managed: open.length > 0, currency: p.currency, baseAmount: p.unit_amount,
            nextAmount: managed ? discountedAmount(p.unit_amount, percent) : null, discountPercent: percent,
            renewsAt: managed?.items?.data?.[0]?.current_period_end ?? null,
            cancelAtPeriodEnd: managed?.cancel_at_period_end ?? false,
            prices: STEPS.map((d) => discountedAmount(p.unit_amount, d)) };
        }
        if (body.action === "portal") {
          if (!a.customer_id) throw new BillingError("No web subscription found.", 404);
          return await stripe("billing_portal/sessions", "POST", {
            customer: a.customer_id, return_url: `${origin}/offer`,
            configuration: required("STRIPE_PORTAL_CONFIGURATION_ID"),
          });
        }
        if (open.length) throw new BillingError("You already have a subscription. Use Manage subscription.", 409);
        // Also avoid charging a customer who already owns Creator Pass on a mobile store.
        const current = await rc(user.id);
        const access = current.subscriber?.entitlements?.[env("REVENUECAT_ENTITLEMENT") || "creator_pass"];
        if (access && (access.expires_date === null || Date.parse(access.expires_date) > Date.now()))
          throw new BillingError("Creator Pass is already active on your account.", 409);
        await validateCoupons(p);
        const portal = await stripe(`billing_portal/configurations/${encodeURIComponent(required("STRIPE_PORTAL_CONFIGURATION_ID"))}`);
        if (!portal.active || !portal.features?.subscription_cancel?.enabled ||
            portal.features.subscription_cancel.mode !== "at_period_end" || portal.features?.subscription_update?.enabled)
          throw new BillingError("Subscription management needs configuration.");
        if (!a.customer_id) {
          const customer = await stripe("customers", "POST", { "metadata[app_user_id]": user.id }, `customer:${a.creation_key}`);
          a.customer_id = customer.id;
          await db(`billing_accounts?user_id=eq.${user.id}`, "PATCH", { customer_id: customer.id });
        }
        if (a.checkout_session_id) {
          const pending = await stripe(`checkout/sessions/${encodeURIComponent(a.checkout_session_id)}`);
          if (pending.status === "open") return { url: pending.url };
          if (pending.status === "complete" && pending.subscription) {
            const completed = await stripe(`subscriptions/${objectId(pending.subscription)}`);
            if (isOpenSubscription(completed)) throw new BillingError("Your payment is processing. Refresh access.", 409);
          }
          a.checkout_key = crypto.randomUUID();
          await db(`billing_accounts?user_id=eq.${user.id}`, "PATCH", { checkout_key: a.checkout_key, checkout_session_id: null });
        }
        const session = await stripe("checkout/sessions", "POST", {
          mode: "subscription", customer: a.customer_id, client_reference_id: user.id,
          "line_items[0][price]": p.id, "line_items[0][quantity]": "1",
          "payment_method_types[0]": "card",
          "subscription_data[metadata][app_user_id]": user.id,
          "subscription_data[metadata][loyalty_policy]": POLICY,
          "subscription_data[metadata][loyalty_percent]": "0",
          "custom_text[submit][message]": "Each paid month earns 5 percentage points off the next renewal, capped at 20%. After expiry, a new subscription starts at full price. Taxes may apply.",
          success_url: `${origin}/offer?billing=success`, cancel_url: `${origin}/offer?billing=cancelled`,
        }, `checkout:${a.checkout_key}`);
        await db(`billing_accounts?user_id=eq.${user.id}`, "PATCH", { checkout_session_id: session.id });
        return { url: session.url };
      });
      return Response.json(result, { headers });
    } catch (e) {
      return Response.json({ error: e instanceof BillingError ? e.message : "Billing is unavailable. Please try again." },
        { status: e instanceof BillingError ? e.status : 503, headers });
    }
  }
  async function webhook(req: Request) {
    try {
      if (req.method !== "POST") return new Response("Use POST", { status: 405 });
      const raw = await req.text();
      if (raw.length > 1048576 || !await verifySignature(raw, req.headers.get("Stripe-Signature") || "", required("STRIPE_WEBHOOK_SECRET")))
        return new Response("Invalid signature", { status: 400 });
      enabled();
      const event = JSON.parse(raw);
      if (event.livemode !== (required("STRIPE_MODE") === "live")) return new Response("Wrong billing mode", { status: 400 });
      const object = event.data?.object;
      const subId = ["invoice.paid", "invoice.upcoming"].includes(event.type) ? subscriptionId(object)
        : ["customer.subscription.updated", "customer.subscription.deleted"].includes(event.type) ? object?.id : null;
      if (subId) await reconcile(subId);
      return Response.json({ received: true });
    } catch { return new Response("Reconciliation failed; retry required", { status: 503 }); }
  }
  return { app, webhook, reconcile };
}
