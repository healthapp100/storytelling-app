-- Real Apple/Google in-app purchases need a fixed store product per price
-- point — there's no way to create one dynamically per video. This mirrors
-- subscription_plans: a small admin-managed table of price tiers, each
-- optionally wired to a RevenueCat product id once that product exists in
-- App Store Connect / Play Console / RevenueCat. A pay-per-video video's
-- price_rupees must match one of these tiers to actually be purchasable —
-- enforced in the admin UI (a dropdown, not free text), not by a DB
-- constraint, so a tier can be added/priced without a migration.
create table public.video_purchase_tiers (
  id uuid primary key default gen_random_uuid(),
  price_rupees int not null unique,
  revenuecat_product_id text,
  active boolean not null default true
);

insert into public.video_purchase_tiers (price_rupees) values (49), (99), (199);

alter table public.video_purchase_tiers enable row level security;

create policy "video_purchase_tiers: read for signed-in users"
  on public.video_purchase_tiers for select
  using (auth.uid() is not null);

create policy "video_purchase_tiers: write by admin only"
  on public.video_purchase_tiers for all
  using (public.is_admin())
  with check (public.is_admin());

-- video_purchases.price_paid_cents predates the rupees migration (0010) —
-- that one only touched subscription_plans and videos because nothing had
-- ever written to video_purchases yet. Renaming now, before the first row
-- is ever inserted by the purchase-video Edge Function.
alter table public.video_purchases rename column price_paid_cents to price_paid_rupees;

-- Prevents the same store transaction from being used to unlock a second
-- video — belt-and-suspenders alongside the check in purchase-video.
create unique index video_purchases_store_transaction_idx
  on public.video_purchases (store_transaction_id)
  where store_transaction_id is not null;
