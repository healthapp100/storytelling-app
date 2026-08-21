import { supabase } from "./supabase";
import type { AccessTier } from "../types/database";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function logActivity(action: string, targetTable: string, targetId: string | null) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase
    .from("admin_activity_log")
    .insert({ admin_id: data.user.id, action, target_table: targetTable, target_id: targetId });
}

export async function createSection(input: { title: string; description: string | null; displayOrder: number }) {
  const { data, error } = await supabase
    .from("sections")
    .insert({
      title: input.title,
      slug: slugify(input.title),
      description: input.description,
      display_order: input.displayOrder,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await logActivity("create", "sections", data.id);
}

export async function updateSection(
  sectionId: string,
  input: { title: string; description: string | null; displayOrder: number }
) {
  const { error } = await supabase
    .from("sections")
    .update({
      title: input.title,
      description: input.description,
      display_order: input.displayOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sectionId);
  if (error) throw new Error(error.message);
  await logActivity("update", "sections", sectionId);
}

export async function deleteSection(sectionId: string) {
  const { error } = await supabase.from("sections").delete().eq("id", sectionId);
  if (error) throw new Error(error.message);
  await logActivity("delete", "sections", sectionId);
}

export type CreateVideoInput = {
  sectionId: string;
  title: string;
  description: string | null;
  storageKey: string;
  durationSeconds: number | null;
  expiresAt: string; // ISO
  isDailyFeatured: boolean;
  accessTier: AccessTier;
  priceCents: number | null;
};

export async function createVideo(input: CreateVideoInput) {
  const { data: userData } = await supabase.auth.getUser();

  if (input.isDailyFeatured) {
    await supabase.from("videos").update({ is_daily_featured: false }).eq("is_daily_featured", true);
  }

  const { data, error } = await supabase
    .from("videos")
    .insert({
      section_id: input.sectionId,
      title: input.title,
      description: input.description,
      storage_key: input.storageKey,
      duration_seconds: input.durationSeconds,
      expires_at: input.expiresAt,
      is_daily_featured: input.isDailyFeatured,
      access_tier: input.accessTier,
      price_cents: input.priceCents,
      status: "live",
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await logActivity("create", "videos", data.id);
}

export type UpdateVideoInput = {
  title: string;
  description: string | null;
  durationSeconds: number | null;
  expiresAt: string;
  accessTier: AccessTier;
  priceCents: number | null;
};

export async function updateVideo(videoId: string, input: UpdateVideoInput) {
  const { error } = await supabase
    .from("videos")
    .update({
      title: input.title,
      description: input.description,
      duration_seconds: input.durationSeconds,
      expires_at: input.expiresAt,
      access_tier: input.accessTier,
      price_cents: input.priceCents,
    })
    .eq("id", videoId);
  if (error) throw new Error(error.message);
  await logActivity("update", "videos", videoId);
}

export async function setDailyFeatured(videoId: string) {
  await supabase.from("videos").update({ is_daily_featured: false }).eq("is_daily_featured", true);
  const { error } = await supabase.from("videos").update({ is_daily_featured: true }).eq("id", videoId);
  if (error) throw new Error(error.message);
  await logActivity("set_daily_featured", "videos", videoId);
}

// Marks the video expired immediately rather than hard-deleting the row —
// see the matching comment in admin/src/app/(admin)/sections/[id]/actions.ts
// for why: only the nightly sweep purges the storage file, and it only
// looks at rows still marked live/scheduled with a past expiry.
export async function expireVideoNow(videoId: string) {
  const { error } = await supabase
    .from("videos")
    .update({ status: "expired", expires_at: new Date().toISOString() })
    .eq("id", videoId);
  if (error) throw new Error(error.message);
  await logActivity("expire_now", "videos", videoId);
}

export async function updatePlan(
  planId: string,
  input: { priceCents: number; revenuecatProductId: string | null; active: boolean }
) {
  const { error } = await supabase
    .from("subscription_plans")
    .update({
      price_cents: input.priceCents,
      revenuecat_product_id: input.revenuecatProductId,
      active: input.active,
    })
    .eq("id", planId);
  if (error) throw new Error(error.message);
  await logActivity("update", "subscription_plans", planId);
}

export async function upsertAppContent(key: string, value: unknown) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("app_content")
    .upsert(
      { key, value, updated_by: userData.user?.id ?? null, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  if (error) throw new Error(error.message);
  await logActivity("update", "app_content", null);
}
