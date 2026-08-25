// Hand-maintained mirror of supabase/migrations/0001_init.sql.
// Once the project is linked, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > types/database.ts

export type Profile = {
  id: string;
  role: "admin" | "subscriber";
  email: string | null;
  phone: string | null;
  display_name: string | null;
  push_token: string | null;
  created_at: string;
};

export type Section = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  display_order: number;
  updated_at: string;
};

export type VideoStatus = "scheduled" | "live" | "expired" | "deleted";
export type AccessTier = "subscription" | "one_time";

export type Video = {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  storage_key: string;
  duration_seconds: number | null;
  posted_at: string;
  expires_at: string;
  is_daily_featured: boolean;
  access_tier: AccessTier;
  price_rupees: number | null;
  status: VideoStatus;
  created_by: string | null;
  created_at: string;
};

// Mirrors supabase/migrations/0011_videos_catalog.sql — browsing metadata
// for every live video, visible regardless of purchase/subscription
// entitlement. Deliberately missing storage_key so it can't be used to
// play a video the viewer hasn't unlocked.
export type VideoCatalogEntry = {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  posted_at: string;
  expires_at: string;
  is_daily_featured: boolean;
  access_tier: AccessTier;
  price_rupees: number | null;
  status: VideoStatus;
};

export type SubscriptionPlan = {
  id: string;
  code: "daily" | "weekly" | "monthly";
  price_rupees: number;
  duration_days: number;
  revenuecat_product_id: string | null;
  active: boolean;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  started_at: string;
  expires_at: string;
  status: "active" | "expired" | "cancelled";
  store: "app_store" | "play_store";
  revenuecat_entitlement_id: string | null;
};

export type VideoPurchase = {
  id: string;
  user_id: string;
  video_id: string;
  purchased_at: string;
  price_paid_cents: number;
  store_transaction_id: string | null;
};

export type AppContent = {
  id: string;
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
};
