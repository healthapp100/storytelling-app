-- Storytelling App — initial schema
-- Mirrors ARCHITECTURE.md §4. Run in order via `supabase db push` / migrations.

-- ============================================================
-- profiles
-- ============================================================
create type public.user_role as enum ('admin', 'subscriber');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'subscriber',
  email text unique,
  phone text unique,
  display_name text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up (email or
-- phone-via-synthetic-email — both go through auth.users the same way).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- sections
-- ============================================================
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  icon_url text,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- videos
-- ============================================================
create type public.video_status as enum ('scheduled', 'live', 'expired', 'deleted');
create type public.access_tier as enum ('subscription', 'one_time');

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  title text not null,
  description text,
  thumbnail_url text,
  storage_key text not null,
  duration_seconds int,
  posted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  is_daily_featured boolean not null default false,
  access_tier public.access_tier not null default 'subscription',
  price_cents int,
  status public.video_status not null default 'scheduled',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint price_required_for_one_time
    check (access_tier <> 'one_time' or price_cents is not null)
);

-- Only one video can be "today's featured video" at a time.
create unique index one_daily_featured_video
  on public.videos (is_daily_featured)
  where is_daily_featured;

create index videos_section_idx on public.videos (section_id);
create index videos_status_expiry_idx on public.videos (status, expires_at);

-- ============================================================
-- subscription plans & purchases
-- ============================================================
create type public.plan_code as enum ('daily', 'weekly', 'monthly');
create type public.subscription_status as enum ('active', 'expired', 'cancelled');
create type public.store_name as enum ('app_store', 'play_store');

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code public.plan_code not null unique,
  price_cents int not null,
  duration_days int not null,
  revenuecat_product_id text,
  active boolean not null default true
);

create table public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status public.subscription_status not null default 'active',
  store public.store_name not null,
  revenuecat_entitlement_id text,
  unique (user_id, plan_id)
);

create index user_subscriptions_user_idx on public.user_subscriptions (user_id, status);

create table public.video_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  purchased_at timestamptz not null default now(),
  price_paid_cents int not null,
  store_transaction_id text,
  unique (user_id, video_id)
);

-- ============================================================
-- app content (editable home-page copy / intro video)
-- ============================================================
create table public.app_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- admin activity log
-- ============================================================
create table public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id),
  action text not null,
  target_table text not null,
  target_id uuid,
  created_at timestamptz not null default now()
);
