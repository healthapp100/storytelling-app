# Mobile app

Expo Router app — sign-in, sections/videos, today's video, subscriptions, push notifications. See `../ARCHITECTURE.md`.

## Setup

```bash
cp .env.example .env   # fill in Supabase + R2 + RevenueCat values
npm install
npx expo start
```

`npx expo start` (Expo Go) is enough for everything **except** subscriptions — `react-native-purchases` is a native module and needs a custom dev client:

```bash
npx expo prebuild        # or: eas build --profile development
npx expo run:android     # or run:ios (needs Xcode, macOS only)
```

## Building for the stores

`eas.json` has `development` / `preview` / `production` profiles already. Once you've run `eas login` and `eas init` (creates the EAS project and fills in `app.json`'s `extra.eas.projectId`, which push notifications also need):

```bash
eas build --profile production --platform all
eas submit --platform all
```

Fill in `eas.json`'s `submit.production` block (Apple ID, App Store Connect app ID, Play service account) before submitting.

## Pushing quick updates without a new build (EAS Update)

Once `eas init` has run, also run:

```bash
eas update:configure
```

This replaces the placeholder in `app.json`'s `updates.url` with your real project's URL (it's currently set to `https://u.expo.dev/YOUR_EAS_PROJECT_ID` — a placeholder, not a real value yet).

After that, whenever you make a **JS/asset-only** change (no new native dependency), you can push it straight to everyone who already has the app installed, without a new build, QR code, or store review:

```bash
eas update --branch production --message "describe the change"
```

They get it automatically next time they open the app. This does **not** work for native changes (e.g. adding a new package like the ones already in this app) — those still need a full `eas build` and a fresh install. `development`/`preview`/`production` builds each check their matching channel (already set in `eas.json`), so an update pushed to `production` only reaches production builds.

## What's here

- `app/(auth)` — sign-in/sign-up, email or phone, one Supabase identity underneath (see `lib/auth.ts`).
- `app/(tabs)` — Home (today's video + intro), Sections, Profile.
- `app/section/[id]`, `app/video/[id]` — video browsing and playback, gated entirely by Supabase RLS.
- `app/subscribe.tsx` — RevenueCat purchase flow for the daily/weekly/monthly plans.
- `lib/purchases.ts` — RevenueCat SDK wiring, keyed to the Supabase user id so the `revenuecat-webhook` Edge Function can sync entitlements back.
- `lib/notifications.ts` — registers the device for "today's video is up" pushes.
