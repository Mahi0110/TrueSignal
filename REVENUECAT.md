# Creator Pass setup

Creator Pass unlocks format/availability discovery filters and collaboration brief export. The core collaboration flow and Audience Share remain free. The offer appears after the Interest DNA flow and when opening an optional premium feature.

## Configuration

1. Connect the intended iOS/Android store to RevenueCat and configure products, packages, and a current offering.
2. Attach products to the `creator_pass` entitlement, or set `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` to your entitlement ID.
3. Publish a paywall with accurate prices, subscription terms, and your privacy/terms links. Prices are supplied by the configured paywall, not hardcoded in the app.
4. Set public platform SDK keys in `.env`: `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
5. Run a native development build with the SDK included. Expo Go does not process purchases. Web billing is an opt-in Stripe integration described in [LOYALTY_BILLING.md](LOYALTY_BILLING.md).

Only public SDK keys belong in the client. The app uses the signed-in Supabase user ID as the RevenueCat App User ID. It serializes identity changes, clears displayed entitlements on account changes, reads SDK customer information, and refreshes it when the app returns to the foreground. It does not grant or simulate premium access locally.

The offer includes purchase, restore, and Customer Center actions. Closing or cancelling the paywall retains free access. Web checkout and a capped loyalty ladder are implemented behind `EXPO_PUBLIC_WEB_BILLING_ENABLED=false`; they require backend deployment and Stripe/RevenueCat configuration before activation. The current gates apply to client-side filtering and export; any future paid server feature must independently verify entitlements on the server.

## Native validation still required

Use the intended store sandbox to verify purchase, cancellation, restore, entitlement expiry, foreground refresh, and switching between two signed-in accounts. Confirm the resulting customer records in RevenueCat and check that one account's access is never shown to the other. Check Customer Center configuration and paywall legal links before release.

No RevenueCat dashboard configuration, store transaction, or live entitlement has been created by these source changes.
