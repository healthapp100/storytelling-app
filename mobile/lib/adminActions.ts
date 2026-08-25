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

export async function createSection(input: {
  title: string;
  description: string | null;
  displayOrder: number;
  iconUrl?: string | null;
}) {
  const { data, error } = await supabase
    .from("sections")
    .insert({
      title: input.title,
      slug: slugify(input.title),
      description: input.description,
      display_order: input.displayOrder,
      icon_url: input.iconUrl ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await logActivity("create", "sections", data.id);
}

export async function updateSection(
  sectionId: string,
  input: { title: string; description: string | null; displayOrder: number; iconUrl?: string | null }
) {
  const { error } = await supabase
    .from("sections")
    .update({
      title: input.title,
      description: input.description,
      display_order: input.displayOrder,
      icon_url: input.iconUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sectionId);
  if (error) throw new Error(error.message);
  await logActivity("update", "sections", sectionId);
}

// Hard-deletes the section and its videos only when none of those videos
// have ever been individually purchased — a purchase record cascades off
// its video row, so wiping a purchased video would destroy the customer's
// only proof of that transaction. If any video in the section has a
// purchase on file, the whole section delete is blocked; the admin has to
// deal with those specific videos (which never hard-delete — see
// deleteVideo below) before the section can go away.
export async function deleteSection(sectionId: string) {
  const { data: videos, error: videosError } = await supabase
    .from("videos")
    .select("id, storage_key")
    .eq("section_id", sectionId);
  if (videosError) throw new Error(videosError.message);

  const videoIds = (videos ?? []).map((v) => v.id);
  if (videoIds.length > 0) {
    const { count, error: purchaseError } = await supabase
      .from("video_purchases")
      .select("id", { count: "exact", head: true })
      .in("video_id", videoIds);
    if (purchaseError) throw new Error(purchaseError.message);
    if (count && count > 0) {
      throw new Error(
        "This section has videos that customers have purchased, so it can't be deleted. Remove those videos individually first."
      );
    }
  }

  for (const video of videos ?? []) {
    await supabase.storage.from("videos").remove([video.storage_key]);
  }

  const { error } = await supabase.from("sections").delete().eq("id", sectionId);
  if (error) throw new Error(error.message);
  await logActivity("delete", "sections", sectionId);
}

// Deletes a video outright only if nobody has ever bought it individually.
// Otherwise the row is kept (status set to "deleted", hidden from every
// user-facing query) so the purchase record referencing it stays intact —
// see the matching note on deleteSection above.
export async function deleteVideo(videoId: string) {
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("storage_key")
    .eq("id", videoId)
    .single();
  if (videoError) throw new Error(videoError.message);

  const { count, error: purchaseError } = await supabase
    .from("video_purchases")
    .select("id", { count: "exact", head: true })
    .eq("video_id", videoId);
  if (purchaseError) throw new Error(purchaseError.message);

  await supabase.storage.from("videos").remove([video.storage_key]);

  if (count && count > 0) {
    const { error } = await supabase.from("videos").update({ status: "deleted" }).eq("id", videoId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("videos").delete().eq("id", videoId);
    if (error) throw new Error(error.message);
  }
  await logActivity("delete", "videos", videoId);
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
  priceRupees: number | null;
  thumbnailUrl?: string | null;
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
      price_rupees: input.priceRupees,
      thumbnail_url: input.thumbnailUrl ?? null,
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
  priceRupees: number | null;
  thumbnailUrl?: string | null;
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
      price_rupees: input.priceRupees,
      thumbnail_url: input.thumbnailUrl ?? null,
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
  input: { priceRupees: number; revenuecatProductId: string | null; active: boolean }
) {
  const { error } = await supabase
    .from("subscription_plans")
    .update({
      price_rupees: input.priceRupees,
      revenuecat_product_id: input.revenuecatProductId,
      active: input.active,
    })
    .eq("id", planId);
  if (error) throw new Error(error.message);
  await logActivity("update", "subscription_plans", planId);
}

export async function updateVideoPurchaseTier(
  tierId: string,
  input: { revenuecatProductId: string | null; active: boolean }
) {
  const { error } = await supabase
    .from("video_purchase_tiers")
    .update({ revenuecat_product_id: input.revenuecatProductId, active: input.active })
    .eq("id", tierId);
  if (error) throw new Error(error.message);
  await logActivity("update", "video_purchase_tiers", tierId);
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
