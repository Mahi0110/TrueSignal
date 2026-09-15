# TrueSignal

Creator discovery through shared interests, complementary skills, and a concrete idea to make together.

## Implemented flow

1. Explore an interactive circle of ten categories. Open a category to select its niches, search, or add a custom niche. Choose 3–10 interests; selections survive category changes and are saved locally.
2. View and share your Interest DNA, then sign in and complete a creator profile with skills, collaboration intent, format, and availability.
3. Discover real, visible profiles with specific reasons for each recommendation. Send an editable collaboration brief with roles and a next step.
4. Accept a request to open a private conversation. Decline, cancel, block, and report controls are available.
5. Propose an Audience Share: a shout-out, joint post, or guest feature. Agree on channels, contributions, and a date; the other creator accepts. Each creator can then attach their own published post URL.

Audience Share records self-reported post links, not reach or impressions. It does not automatically publish posts or exchange follower lists. Messaging currently refreshes on screen focus or using Refresh; push notifications and realtime delivery are not implemented.

Creator Pass optionally unlocks advanced discovery filters and brief export in native builds. Discovery, requests, messaging, and Audience Share remain free. See [REVENUECAT.md](REVENUECAT.md).

## Run locally

Use Node 24 LTS.

```sh
npm ci
cp .env.example .env
npm run web
```

Without Supabase configuration, the circle and DNA preview work locally; account and collaboration screens show the service connection state. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to your project's public client values. Never put a service role key in the app. An optional `EXPO_PUBLIC_APP_URL` adds your public HTTPS landing link to user-initiated DNA shares.

Apply migrations in order to the intended Supabase project:

- `supabase/migrations/20260903_initial_schema.sql`
- `supabase/migrations/20260915_collaboration_flow.sql`
- `supabase/migrations/20260915083734_harden_profile_trigger_access.sql`

If the initial schema is already installed, apply only the remaining migrations. Check the live schema as well as migration history: the original schema can have been installed manually, and applying files through the dashboard or connector can assign a different migration version. Configure email authentication and confirmation redirect URLs for the app. Cloning or building this app does not apply database migrations automatically.

## Data and permissions

Profiles are discoverable only after onboarding and only when their owner enables discovery. Blocking hides both accounts from each other and closes their active collaboration and Audience Share flows. Request acceptance is restricted to the recipient; messaging requires an accepted request. Audience Share approval requires the other participant, and only the authenticated creator can write their own post link. Completed collaborations require active Audience Share plans to be finished or cancelled first.

Row-level security and validated database functions enforce these rules. Reports are private records for operator review in Supabase; an administrative moderation UI is not included. Private messages, reports, and collaboration details are unavailable to unrelated accounts.

`creator_outcomes` is a service-only aggregate of onboarding, request, completed collaboration, and Audience Share events. It separates accounts marked `is_test`; only an operator can set that flag. Events are written by validated database actions, not by client analytics calls. No claimed user counts or match percentages are included.

## Verification

```sh
npm run check
npm run build:web
```

Tests run the migrations and permissions in an isolated PGlite PostgreSQL database using synthetic accounts. They cover acceptance, private messages, blocking, reports, Audience Share approval and post ownership, duplicate requests, and outcome events. UI component tests exercise category/niche navigation, preserved selections, search, custom interests, and the selection cap.

PGlite supplies `gen_random_uuid` without installing `pgcrypto`; the test harness omits only that extension declaration. These tests do not replace a staging Supabase smoke test. Browser visual QA and native store transactions also require separate verification in an environment that can open the app.

`tests/live_smoke.sql` verifies the deployed signup trigger, collaboration functions, participant permissions, Audience Share, blocking, and reports in the Supabase SQL editor. It uses three synthetic accounts inside a transaction and rolls back every sample row without sending emails. It verifies database roles and functions, not the end-to-end Auth HTTP or app UI flow.

The signup trigger is internal and has no client execution grant. Signed-in creators intentionally retain access to the validated collaboration functions; the Supabase advisor flags these `SECURITY DEFINER` functions for review. Their actor and participant checks are covered by the local and live tests. See the [Supabase advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Stack

Expo SDK 54 · React Native · TypeScript · Expo Router · Supabase · RevenueCat
