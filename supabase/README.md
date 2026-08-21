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
   `0004_cron.sql` and `0005_push_notifications.sql` both call an Edge Function URL with a placeholder `<project-ref>`/`<service-role-key>` — either edit those files with your real values before pushing, or push everything else first and apply those two manually from the SQL Editor once the functions below are deployed.
3. Set Edge Function secrets (R2 credentials, RevenueCat webhook secret):
   ```bash
   npx supabase secrets set R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=... REVENUECAT_WEBHOOK_SECRET=...
   ```
4. Deploy the functions:
   ```bash
   npx supabase functions deploy expire-videos
   npx supabase functions deploy revenuecat-webhook
   npx supabase functions deploy r2-upload-url
   npx supabase functions deploy send-daily-notification
   ```
5. Promote your own account to admin once you've signed up through the app:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

## Layout

- `migrations/` — schema, RLS policies, seed data, cron schedule, push token column + trigger (applied in filename order).
- `functions/expire-videos` — nightly sweep that deletes expired videos from R2 and marks rows `deleted`.
- `functions/revenuecat-webhook` — syncs subscription entitlements from RevenueCat into `user_subscriptions`.
- `functions/r2-upload-url` — issues a presigned R2 upload URL for the admin panel's video upload form.
- `functions/send-daily-notification` — fans out an Expo push to every registered device when a video becomes "today's featured video" (triggered by the `on_daily_video_featured` DB trigger in `0005_push_notifications.sql`).

See `../ARCHITECTURE.md` for the reasoning behind each piece.
