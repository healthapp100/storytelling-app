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

## What's here

- `app/(auth)` — sign-in/sign-up, email or phone, one Supabase identity underneath (see `lib/auth.ts`).
- `app/(tabs)` — Home (today's video + intro), Sections, Profile.
- `app/section/[id]`, `app/video/[id]` — video browsing and playback, gated entirely by Supabase RLS.
- `app/subscribe.tsx` — RevenueCat purchase flow for the daily/weekly/monthly plans.
- `lib/purchases.ts` — RevenueCat SDK wiring, keyed to the Supabase user id so the `revenuecat-webhook` Edge Function can sync entitlements back.
- `lib/notifications.ts` — registers the device for "today's video is up" pushes.
