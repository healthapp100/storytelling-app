-- Switches pricing from "smallest unit" (paise, so 100 = ₹1 — the R2/cents-
-- style convention originally used) to whole rupees, so an admin typing
-- "199" means ₹199, not ₹1.99. Converts existing values first so prices
-- already entered keep their real-world meaning, then renames the columns
-- so the new unit can't be confused with the old one.

update public.subscription_plans set price_cents = price_cents / 100;
update public.videos set price_cents = price_cents / 100 where price_cents is not null;

alter table public.subscription_plans rename column price_cents to price_rupees;
alter table public.videos rename column price_cents to price_rupees;

alter table public.videos drop constraint if exists price_required_for_one_time;
alter table public.videos add constraint price_required_for_one_time
  check (access_tier <> 'one_time' or price_rupees is not null);
