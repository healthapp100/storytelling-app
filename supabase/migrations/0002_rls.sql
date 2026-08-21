-- Row Level Security — mirrors ARCHITECTURE.md §4 "in plain terms".

create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create function public.has_active_subscription()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_subscriptions
    where user_id = auth.uid()
      and status = 'active'
      and expires_at > now()
  );
$$;

-- ---------------- profiles ----------------
alter table public.profiles enable row level security;

create policy "profiles: read own or admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles: update own or admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- ---------------- sections ----------------
alter table public.sections enable row level security;

create policy "sections: read for signed-in users"
  on public.sections for select
  using (auth.uid() is not null);

create policy "sections: write by admin only"
  on public.sections for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------- videos ----------------
alter table public.videos enable row level security;

create policy "videos: read if entitled or admin"
  on public.videos for select
  using (
    public.is_admin()
    or (
      status = 'live'
      and (
        (access_tier = 'subscription' and public.has_active_subscription())
        or exists (
          select 1 from public.video_purchases
          where video_purchases.video_id = videos.id
            and video_purchases.user_id = auth.uid()
        )
      )
    )
  );

create policy "videos: write by admin only"
  on public.videos for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------- subscription plans ----------------
alter table public.subscription_plans enable row level security;

create policy "plans: read for signed-in users"
  on public.subscription_plans for select
  using (auth.uid() is not null);

create policy "plans: write by admin only"
  on public.subscription_plans for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------- user_subscriptions ----------------
alter table public.user_subscriptions enable row level security;

create policy "user_subscriptions: read own or admin"
  on public.user_subscriptions for select
  using (user_id = auth.uid() or public.is_admin());

-- No insert/update policy for regular users on purpose: rows are written
-- only by the RevenueCat-webhook Edge Function using the service role key,
-- which bypasses RLS entirely. A user can't grant themselves a subscription.
create policy "user_subscriptions: admin can manage"
  on public.user_subscriptions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------- video_purchases ----------------
alter table public.video_purchases enable row level security;

create policy "video_purchases: read own or admin"
  on public.video_purchases for select
  using (user_id = auth.uid() or public.is_admin());

create policy "video_purchases: admin can manage"
  on public.video_purchases for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------- app_content ----------------
alter table public.app_content enable row level security;

create policy "app_content: read for everyone signed in"
  on public.app_content for select
  using (auth.uid() is not null);

create policy "app_content: write by admin only"
  on public.app_content for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------- admin_activity_log ----------------
alter table public.admin_activity_log enable row level security;

create policy "admin_activity_log: admin only"
  on public.admin_activity_log for all
  using (public.is_admin())
  with check (public.is_admin());
