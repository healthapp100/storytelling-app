-- Switches video storage from Cloudflare R2 to Supabase Storage (no
-- Cloudflare payment method available for now — see ARCHITECTURE.md for
-- the original R2 reasoning; this bucket is a drop-in replacement using
-- the same public-bucket-plus-RLS-on-writes model).

insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- Public bucket => anyone can read an object's bytes directly by URL, same
-- as the R2 setup. Real access control still happens one layer up, at the
-- `videos` table's RLS (0002_rls.sql) — a video's storage_key is only ever
-- handed to a client whose row-level query was allowed to see it.
create policy "videos bucket: admin can upload"
  on storage.objects for insert
  with check (bucket_id = 'videos' and public.is_admin());

create policy "videos bucket: admin can update"
  on storage.objects for update
  using (bucket_id = 'videos' and public.is_admin());

create policy "videos bucket: admin can delete"
  on storage.objects for delete
  using (bucket_id = 'videos' and public.is_admin());
