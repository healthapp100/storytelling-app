// Kept in sync with ../../supabase/migrations/0001_init.sql by hand — see
// mobile/types/database.ts for the app-side copy of the same shapes.

export type Profile = {
  id: string;
  role: "admin" | "subscriber";
  email: string | null;
  phone: string | null;
  display_name: string | null;
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
  price_cents: number | null;
  status: VideoStatus;
  created_by: string | null;
  created_at: string;
};

export type SubscriptionPlan = {
  id: string;
  code: "daily" | "weekly" | "monthly";
  price_cents: number;
  duration_days: number;
  revenuecat_product_id: string | null;
  active: boolean;
};

export type AppContent = {
  id: string;
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
};

export type AdminActivityLog = {
  id: string;
  admin_id: string;
  action: string;
  target_table: string;
  target_id: string | null;
  created_at: string;
};
