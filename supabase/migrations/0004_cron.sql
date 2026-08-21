-- Nightly sweep that expires videos past their expires_at and purges them
-- from R2, via the `expire-videos` Edge Function. See ARCHITECTURE.md §5.
--
-- Requires the pg_cron and pg_net extensions, enabled by default on
-- Supabase projects (Database → Extensions if not).
--
-- IMPORTANT: replace the placeholders below with your project's actual
-- values after `supabase functions deploy expire-videos`. The service role
-- key is required because this call must bypass RLS to update video status;
-- keep it out of version control in real deployments (use `supabase secrets`
-- or edit this directly on the hosted project instead of committing it).

select cron.schedule(
  'expire-videos-nightly',
  '0 2 * * *', -- 02:00 UTC daily
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/expire-videos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <service-role-key>'
    ),
    body := '{}'::jsonb
  );
  $$
);
