-- Fixes a real revenue/UX bug: has_active_subscription() only checked
-- status = 'active', but a subscription that's been cancelled (auto-renew
-- turned off) still has status moving to 'cancelled' via the
-- revenuecat-webhook fix in this same commit — and a cancelled-but-not-yet-
-- expired subscription must still grant access until expires_at passes.
-- Without this, anyone who cancels auto-renew loses access immediately
-- instead of at the end of the period they already paid for.

create or replace function public.has_active_subscription()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_subscriptions
    where user_id = auth.uid()
      and status in ('active', 'cancelled')
      and expires_at > now()
  );
$$;
