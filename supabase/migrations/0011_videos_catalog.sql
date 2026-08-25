-- Fixes a real UX gap: the "videos: read if entitled or admin" RLS policy
-- (0002_rls.sql) means a signed-in user who isn't subscribed and hasn't
-- bought a pay-per-video story can't see that row AT ALL — not just blocked
-- from playing it, invisible in every list. A subscription-tier video
-- disappears from a non-subscriber's home screen and section list instead
-- of teasing them into subscribing; a pay-per-video story has no purchase
-- flow yet (see ARCHITECTURE.md — real IAP needs a per-price store product,
-- pending a product decision) and was simply unbrowsable.
--
-- This view exposes browsing metadata for every live video to any signed-in
-- user, regardless of entitlement — everything except storage_key, so it
-- can't be used to construct a playback URL. Actual playback still goes
-- through the videos table directly and stays fully RLS-gated.
--
-- Views run with the privileges of their owner (not the querying user)
-- unless created WITH (security_invoker = true), so this naturally bypasses
-- the videos table's row-level security — the standard Supabase pattern for
-- a deliberately-public slice of an otherwise-locked-down table.
create view public.videos_catalog as
select
  id,
  section_id,
  title,
  description,
  thumbnail_url,
  duration_seconds,
  posted_at,
  expires_at,
  is_daily_featured,
  access_tier,
  price_rupees,
  status
from public.videos
where status = 'live';

grant select on public.videos_catalog to authenticated;
