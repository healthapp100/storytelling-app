# Mobile app

Expo Router app — sign-in, sections/videos, today's video, subscriptions, push notifications. See `../ARCHITECTURE.md`.

## Setup

```bash
cp .env.example .env   # fill in Supabase + RevenueCat values
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

## Crash reporting (Sentry)

1. Create a free account at [sentry.io](https://sentry.io), then a project (platform: React Native).
2. Copy the **DSN** it gives you into `mobile/.env` as `EXPO_PUBLIC_SENTRY_DSN`. This value is meant to be public (it's embedded in the client app), unlike the other keys in this project.
3. In `app.json`, replace `YOUR_SENTRY_ORG_SLUG` / `YOUR_SENTRY_PROJECT_SLUG` in the `@sentry/react-native/expo` plugin config with your org/project slugs (visible in the Sentry project URL).
4. Optional but recommended — for readable stack traces instead of minified JS: create a Sentry auth token (Settings → Auth Tokens) and set it as an EAS secret so it's available during cloud builds, without ever living in this repo:
   ```bash
   eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value <your-token>
   ```
5. Rebuild (`eas build`) — Sentry is native-module-based, so it needs a fresh build like the other native packages, not just an `eas update`.
6. To verify it's actually working: open the app, go to **Profile**, and tap "Send test error to Sentry (dev only)" — that button only appears in a dev build and should make an error show up in your Sentry project's Issues tab within a few seconds.

If `EXPO_PUBLIC_SENTRY_DSN` is left unset, the app runs fine — crash reporting is just silently off, with a console warning in dev.

## What's here

- `app/(auth)` — sign-in/sign-up, email or phone, one Supabase identity underneath (see `lib/auth.ts`).
- `app/(tabs)` — Home (today's video + intro), Sections, Profile.
- `app/section/[id]`, `app/video/[id]` — video browsing and playback, gated entirely by Supabase RLS.
- `app/subscribe.tsx` — RevenueCat purchase flow for the daily/weekly/monthly plans.
- `lib/purchases.ts` — RevenueCat SDK wiring, keyed to the Supabase user id so the `revenuecat-webhook` Edge Function can sync entitlements back.
- `lib/notifications.ts` — registers the device for "today's video is up" pushes.
- `app/(tabs)/admin.tsx`, `app/admin-section/[id].tsx` — full admin CRUD (sections, videos, pricing, home content) built directly into the app, visible only when the signed-in account's `profiles.role` is `admin`. This mirrors the web admin panel one-for-one; use whichever is more convenient — both write to the same tables through the same RLS policies. See `../ARCHITECTURE.md` §7 and the note in this README's history about why a separate web panel is still the primary tool for anything beyond quick on-the-go edits.
