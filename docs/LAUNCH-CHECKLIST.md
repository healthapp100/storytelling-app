# Launch checklist (Android)

All application code is written. What remains needs accounts, dashboards and a real device. iOS is deliberately out of scope for now.

## 1. Supabase
- [ ] Run every migration in `supabase/migrations/` in order, `0001` through `0012` (`0008`–`0012` are the security fix, cancelled-subscription access, rupee pricing, the public `videos_catalog` view, and pay-per-video tiers).
- [ ] Set secrets: `REVENUECAT_WEBHOOK_SECRET` and `REVENUECAT_SECRET_API_KEY`.
- [ ] Deploy functions: `expire-videos`, `revenuecat-webhook` (with `--no-verify-jwt`), `send-daily-notification`, `purchase-video`.
- [ ] In `0004_cron.sql` and `0005_push_notifications.sql`, replace `<secret-key>` with the service-role key **in the SQL editor only — never commit it**.
- [ ] Promote the owner account to admin (see [supabase.md](supabase.md)).

## 2. Google Play Console
- [ ] Create the developer account (one-time fee) and the app (`com.storytellingapp.mobile`).
- [ ] Create 3 subscription products (daily / weekly / monthly) and 3 consumable products for the pay-per-video tiers.
- [ ] Store listing: name, description, screenshots, privacy-policy URL, data-safety form, a reviewer demo account.

## 3. RevenueCat
- [ ] Add the Android app, import the six products, put them in the current Offering as packages.
- [ ] Point the webhook at the deployed `revenuecat-webhook` function with the shared secret.
- [ ] Copy the Android public SDK key into the EAS environment as `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
- [ ] Paste each product ID into the admin panel (Pricing → plans, and Pay-per-video tiers).

## 4. Environment variables (EAS, `preview` and `production`)
`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, `EXPO_PUBLIC_LEGAL_URL` (the deployed admin panel URL, which serves `/privacy` and `/terms`), and optionally `EXPO_PUBLIC_SENTRY_DSN`.

## 5. Replace placeholders
- [ ] Support email on `/privacy` and `/terms` (`admin/src/app/privacy`, `admin/src/app/terms`).

## 6. Test before submitting
- [ ] Run [the load test](loadtest.md) against the live project.
- [ ] On a real device: sign up, subscribe, buy a pay-per-video story, restore purchases, cancel (access should last until the paid period ends), play and resume a video, receive the daily push.
- [ ] Admin: upload a video with thumbnail, edit, delete a purchased and an unpurchased video.

## 7. Ship
- [ ] Create a Play service-account key and fill in `submit.production` in `mobile/eas.json`.
- [ ] `eas build --platform android --profile production`, then `eas submit`.
- [ ] After release, JS-only fixes go out with `eas update`; anything touching native code needs a new build.
