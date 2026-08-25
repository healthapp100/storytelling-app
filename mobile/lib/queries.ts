import { supabase } from "./supabase";
import type { AppContent, Section, SubscriptionPlan, Video, VideoCatalogEntry } from "../types/database";

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("active", true)
    .order("duration_days");
  if (error) throw error;
  return data ?? [];
}

export async function getAppContent(key: string): Promise<AppContent | null> {
  const { data, error } = await supabase.from("app_content").select("*").eq("key", key).maybeSingle();
  if (error) throw error;
  return data;
}

// Reads from videos_catalog, not videos directly — a non-subscriber must
// still see today's featured story on the home screen (as a teaser that
// leads to the paywall) rather than have it vanish because RLS blocks the
// underlying row. See migration 0011_videos_catalog.sql.
export async function getTodaysVideo(): Promise<VideoCatalogEntry | null> {
  const { data, error } = await supabase
    .from("videos_catalog")
    .select("*")
    .eq("is_daily_featured", true)
    .order("posted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSections(): Promise<Section[]> {
  const { data, error } = await supabase.from("sections").select("*").order("display_order");
  if (error) throw error;
  return data ?? [];
}

// Same reasoning as getTodaysVideo above: this must show every live video
// in the section, purchased or not, so pay-per-video content is browsable
// (with its price visible) instead of silently absent from the list.
export async function getVideosForSection(sectionId: string): Promise<VideoCatalogEntry[]> {
  const { data, error } = await supabase
    .from("videos_catalog")
    .select("*")
    .eq("section_id", sectionId)
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getVideo(id: string): Promise<Video | null> {
  const { data, error } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

// Falls back to the browsing-only catalog entry when RLS has blocked the
// full video row (viewer isn't entitled) — lets the denial screen explain
// *why* ("subscribe to unlock" vs "pay-per-video isn't purchasable yet")
// instead of a single generic "not available" message.
export async function getVideoCatalogEntry(id: string): Promise<VideoCatalogEntry | null> {
  const { data, error } = await supabase.from("videos_catalog").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

// RLS already blocks the row if the viewer isn't entitled, so a successful
// fetch above is itself sufficient proof of access — no separate check needed.
export function videoPlaybackUrl(video: Video): string {
  return storagePublicUrl(video.storage_key);
}

export function storagePublicUrl(storageKey: string): string {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/videos/${storageKey}`;
}

// --- Admin reads: unlike the subscriber-facing queries above, these don't
// filter by status/active — an admin needs to see everything to manage it.
// RLS still only returns rows at all if the caller's profile.role='admin'.

export async function getAllVideosForSectionAdmin(sectionId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("section_id", sectionId)
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase.from("subscription_plans").select("*").order("duration_days");
  if (error) throw error;
  return data ?? [];
}
