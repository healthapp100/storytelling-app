-- Push token storage + trigger that fires "today's video is up" pushes.
-- See ARCHITECTURE.md — push notifications, added past the original design.

alter table public.profiles add column push_token text;

-- Fires the send-daily-notification Edge Function whenever a video becomes
-- today's featured video. Mirrors the pg_net pattern in 0004_cron.sql.
--
-- IMPORTANT: replace the placeholders below with your project's real values
-- after `supabase functions deploy send-daily-notification` — same caveat
-- as 0004_cron.sql about not committing the real service role key.
create function public.notify_daily_video_featured()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.is_daily_featured and (tg_op = 'INSERT' or old.is_daily_featured is distinct from new.is_daily_featured) then
    perform net.http_post(
      url := 'https://hqkuhapqbttphfidtsky.supabase.co/functions/v1/send-daily-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <secret-key>'
      ),
      body := jsonb_build_object('videoId', new.id, 'title', new.title)
    );
  end if;
  return new;
end;
$$;

create trigger on_daily_video_featured
  after insert or update on public.videos
  for each row execute procedure public.notify_daily_video_featured();
