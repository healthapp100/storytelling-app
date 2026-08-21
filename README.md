# Storytelling App

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system design, data model, and the reasoning behind every decision. Read this first.
- [`mobile/`](./mobile) — the Expo (React Native) app: sign-in, sections, video player, today's video, subscriptions, push notifications.
- [`admin/`](./admin) — the Next.js admin panel: sections/videos CRUD, pricing, home content, activity log.
- [`supabase/`](./supabase) — schema, RLS policies, seed data, and Edge Functions.

## Everything is coded. Manual setup is the only thing left.

Per your call, all the manual account/infra setup is deferred to the end — every line of app, admin, and backend code is written and either type-checks or builds clean. Nothing below requires more code; it requires accounts and a few clicks.

### 1. Supabase
- Create a project, run `supabase/README.md` steps 1–5 (push migrations — this now also creates the `videos` Storage bucket — set the RevenueCat webhook secret, deploy the three functions), then step 5 to promote yourself to admin.
- To stop the free tier's project from pausing after 7 idle days, add two repo secrets in **Settings → Secrets and variables → Actions**: `SUPABASE_URL` and `SUPABASE_ANON_KEY` (both from Project Settings → API). [`.github/workflows/keep-supabase-awake.yml`](.github/workflows/keep-supabase-awake.yml) then pings it every 3 days automatically — nothing else to do. Only matters during quiet dev stretches; once real users are hitting the app daily, it's a no-op.

### 2. Video storage — already done, no account needed
- Videos live in Supabase Storage (the `videos` bucket, created by the migrations in step 1) — no separate Cloudflare R2 account, API token, or payment method required. This replaced the original R2 plan since R2 needed a card/PayPal on file that wasn't available; functionally it's a drop-in swap, not a compromise, and can move to R2 later without touching the data model. See `supabase/README.md`.

### 3. RevenueCat
- Create a RevenueCat project, add your iOS/Android apps, and create products matching `subscription_plans` (daily/weekly/monthly) in App Store Connect and Play Console first — RevenueCat mirrors the store's products, not the other way around.
- Copy the iOS/Android public API keys into `mobile/.env`.
- Point RevenueCat's webhook (Project Settings → Integrations) at the deployed `revenuecat-webhook` function, with a shared secret matching `REVENUECAT_WEBHOOK_SECRET`.

### 4. App Store Connect / Google Play Console
- Register the app (bundle ID `com.storytellingapp.mobile` is already set in `mobile/app.json` — change it first if you want something else), create the subscription products, and get the store listing basics ready (name, screenshots, privacy policy URL).

### 5. EAS
- `eas login`, `eas init` (from `mobile/`) to create the EAS project and populate `extra.eas.projectId` — this also unlocks push notifications.
- Fill in `mobile/eas.json`'s `submit.production` block, then `eas build` and `eas submit` per `mobile/README.md`.

### 6. Admin panel hosting
- Deploy `admin/` anywhere that runs Next.js (Vercel is the path of least resistance) with the same `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the mobile app.

## Local dev, right now

```bash
# backend
cd supabase && follow README.md

# mobile app
cd mobile && cp .env.example .env && npm install && npx expo start

# admin panel
cd admin && cp .env.example .env.local && npm install && npm run dev
```

## What's built

- **Auth**: email+password and phone+password, one Supabase identity underneath, persistent session (no forced expiry), native autofill.
- **Content model**: sections → videos, mandatory expiry dates, subscription-gated or pay-per-video, "today's featured video."
- **Video lifecycle**: direct-to-Supabase-Storage upload from the admin panel and the in-app Admin tab, nightly expiry sweep that deletes the storage file and marks the row `deleted`.
- **Subscriptions**: RevenueCat purchase flow in the app, webhook-synced entitlements, RLS that gates video access on those entitlements — no app-side access checks to trust.
- **Push notifications**: device registration, a DB trigger on "today's video" being set, an Edge Function that fans the push out via Expo's push API, and tap-to-open deep linking back to that video.
- **Admin panel**: sections and videos CRUD, pricing editor, home-page content editor (including the static intro video), an admin activity log — all gated by the same RLS as the app, not just page-level checks.
- **Build config**: EAS profiles for dev/preview/production, bundle identifiers set for both stores.

Type-checked and built clean: `mobile` (`tsc`, `expo-doctor`), `admin` (`tsc`, `next build`, `eslint`).
