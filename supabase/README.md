# Supabase backend

## Setup

1. Create a project at supabase.com, then link it:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   ```
2. Push the schema:
   ```bash
   npx supabase db push
   ```
   `0004_cron.sql` and `0005_push_notifications.sql` both call an Edge Function URL with a placeholder `<project-ref>`/`<secret-key>` — either edit those files with your real values before pushing, or push everything else first and apply those two manually from the SQL Editor once the functions below are deployed.
3. Set the Edge Function secrets:
   ```bash
   npx supabase secrets set REVENUECAT_WEBHOOK_SECRET=...
   npx supabase secrets set REVENUECAT_SECRET_API_KEY=...
   ```
   `REVENUECAT_WEBHOOK_SECRET` is a string you make up yourself and paste into both places (RevenueCat dashboard's webhook config and here). `REVENUECAT_SECRET_API_KEY` is different — it's RevenueCat's own server-side key from Project Settings → API Keys → Secret keys, used by `purchase-video` to verify a pay-per-video purchase actually happened before granting access.
4. Deploy the functions. `revenuecat-webhook` needs `--no-verify-jwt` — RevenueCat sends its own shared-secret Bearer token, not a Supabase-signed JWT, and without this flag the function gateway rejects every real webhook with 401 before the function's own secret check ever runs (this is also set in `config.toml`, but pass the flag explicitly too since older CLI versions don't always pick that up):
   ```bash
   npx supabase functions deploy expire-videos
   npx supabase functions deploy revenuecat-webhook --no-verify-jwt
   npx supabase functions deploy send-daily-notification
   npx supabase functions deploy purchase-video
   ```
5. Promote your own account to admin once you've signed up through the app:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

## Layout

- `migrations/` — schema, RLS policies, seed data, cron schedule, push token column + trigger, and the `videos` Storage bucket (applied in filename order).
- `functions/expire-videos` — nightly sweep that deletes expired videos from Supabase Storage and marks rows `deleted`.
- `functions/revenuecat-webhook` — syncs subscription entitlements from RevenueCat into `user_subscriptions`.
- `functions/send-daily-notification` — fans out an Expo push to every registered device when a video becomes "today's featured video" (triggered by the `on_daily_video_featured` DB trigger in `0005_push_notifications.sql`).
- `functions/purchase-video` — verifies a pay-per-video purchase against RevenueCat and grants access by inserting into `video_purchases`. See the comment at the top of `functions/purchase-video/index.ts` for why this can't go through the `revenuecat-webhook` path like subscriptions do.

## Video storage

Videos live in the `videos` Supabase Storage bucket (public bucket + admin-only write policies, see `migrations/0007_storage.sql`) — not Cloudflare R2. The app and admin panel upload directly to it using the signed-in user's own session; no presigned-URL Edge Function or separate storage credentials are needed. R2 was the original plan (see `ARCHITECTURE.md`) but needed a payment method on file that wasn't available yet — this is a drop-in swap, not a workaround, and can be swapped back later without touching the data model.

See `../ARCHITECTURE.md` for the reasoning behind everything else.
