-- Enables Postgres Changes broadcasts for the tables the app needs to
-- update live when an admin edits them (sections, videos, app_content).
-- Without this, Supabase Realtime never emits change events for these
-- tables, and the app would only ever see admin edits after a manual
-- refetch. See mobile/lib/realtime.ts for the subscriber side.

alter publication supabase_realtime add table public.sections;
alter publication supabase_realtime add table public.videos;
alter publication supabase_realtime add table public.app_content;
alter publication supabase_realtime add table public.subscription_plans;
