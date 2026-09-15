# Run TrueSignal

## Web app

Open the deployed TrueSignal link in your browser. This Sites deployment starts with private access for the owner. Change its sharing settings to Public when you want people outside your account to use it.

Choose **Explore my interests**. Tap a category circle, choose 3–10 niches, reveal your Interest DNA, then create an account and complete your profile. Audience Share is available inside a collaboration after the other creator accepts the request.

## Windows: run the current code

Install Node.js 24 LTS and Git. Open PowerShell in the folder where you keep projects.

If you do not have this repository yet:

```powershell
git clone --branch codex/collaboration-flow-20260915 https://github.com/Mahi0110/TrueSignal.git
cd TrueSignal
npm ci
Copy-Item .env.example .env
notepad .env
```

If you already have the repository, open its folder and save your local edits before changing branches:

```powershell
git fetch origin
git switch codex/collaboration-flow-20260915
git pull --ff-only
npm ci
```

Keep your existing `.env` file. If it is missing, copy `.env.example` to `.env`. Fill these two values from your Supabase project settings:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://zlfaqdvjghnfroeioife.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

The ANON_KEY variable accepts the modern `sb_publishable_...` key. Use your public client key; never put a service-role key here. The live database migrations have already been applied to this project.

Start the web app:

```powershell
npm run web
```

Open the local URL printed in the terminal. Stop the server with Ctrl+C. After editing `.env`, restart with `npx expo start --web --clear`.

## Phone preview

For this Expo SDK 54 app, use a compatible Expo Go version or a native development build. Newer store versions of Expo Go may not support SDK 54; the phone browser can always use the hosted web app.

With the computer and phone on the same Wi-Fi, run:

```powershell
npx expo start
```

Scan the QR code with the compatible Expo client. Core interests and collaboration features can be previewed this way. See [Expo's development instructions](https://docs.expo.dev/get-started/start-developing/).

## Native Android and purchases

RevenueCat purchases require a native development build. They are disabled in this app's browser and Expo Go previews. Configure platform public SDK keys and the `creator_pass` entitlement as described in [REVENUECAT.md](REVENUECAT.md).

Install Android Studio, the Android SDK, and the required JDK. Start an emulator or connect a development-enabled Android device, then run:

```powershell
npx expo install expo-dev-client
npx expo run:android
```

After the first native build:

```powershell
npx expo start --dev-client
```

Native iOS builds require macOS and Xcode, or a separately configured EAS cloud build. Native builds and store transactions were not run in this workspace. See the [RevenueCat Expo guide](https://www.revenuecat.com/docs/getting-started/installation/expo).

## Email confirmation

In Supabase, open Authentication → URL Configuration and set the Site URL to the deployed TrueSignal address. Add your local development URL to allowed redirects if needed. After confirming an email, return to the app and sign in. Email delivery and confirmation redirects still need an end-to-end check; the database test verifies roles and functions only.

## Build another web release

```powershell
npm run check
npm run build
```

The generated website is in `dist`. Publish that folder through Sites using the checked-in hosting configuration. Only the public Supabase client configuration is compiled into the website; native store keys and server secrets are not required for the web build.
