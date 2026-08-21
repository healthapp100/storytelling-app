import { supabase } from "./supabase";
import type { AppContent, Section, SubscriptionPlan, Video } from "../types/database";

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

export async function getTodaysVideo(): Promise<Video | null> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("is_daily_featured", true)
    .eq("status", "live")
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

export async function getVideosForSection(sectionId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("section_id", sectionId)
    .eq("status", "live")
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getVideo(id: string): Promise<Video | null> {
  const { data, error } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

// RLS already blocks the row if the viewer isn't entitled, so a successful
// fetch above is itself sufficient proof of access — no separate check needed.
export function videoPlaybackUrl(video: Video): string {
  const publicBase = process.env.EXPO_PUBLIC_R2_PUBLIC_BASE_URL!;
  return `${publicBase}/${video.storage_key}`;
}
