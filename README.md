# Storytelling App

A subscription storytelling app (Sutras, Slokas, Puranas): an Expo mobile app, a Next.js admin panel, and a Supabase backend.

| Folder | What it is |
|---|---|
| [`mobile/`](mobile) | Expo (React Native) app: auth, library, video player, subscriptions and pay-per-video, push notifications, in-app admin. |
| [`admin/`](admin) | Next.js admin panel: sections and videos, pricing and purchase tiers, home content, activity log, public privacy/terms pages. |
| [`supabase/`](supabase) | Migrations (schema, RLS, storage), Edge Functions, cron. |
| [`loadtest/`](loadtest) | k6 load test for 200+ concurrent users. |
| [`docs/`](docs) | All documentation. |

## Documentation

Everything lives in [`docs/`](docs): [architecture](docs/ARCHITECTURE.md), the [launch checklist](docs/LAUNCH-CHECKLIST.md), and a guide per component ([mobile](docs/mobile.md), [admin](docs/admin.md), [supabase](docs/supabase.md), [load test](docs/loadtest.md)).

## Status

Application code is complete for Android. Remaining work is account setup, store configuration and device testing, tracked in the [launch checklist](docs/LAUNCH-CHECKLIST.md). iOS is not yet built.

## Local development

```bash
# backend: see docs/supabase.md
# mobile
cd mobile && cp .env.example .env && npm install && npx expo start
# admin
cd admin && cp .env.example .env.local && npm install && npm run dev
```
