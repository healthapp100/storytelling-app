"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";
import { requireAdmin, logActivity } from "../../../../lib/require-admin";

export async function createVideo(sectionId: string, formData: FormData) {
  const { userId } = await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const storageKey = String(formData.get("storage_key") ?? "").trim();
  const durationSeconds = Number(formData.get("duration_seconds") ?? 0) || null;
  const expiresAt = String(formData.get("expires_at") ?? "");
  const isDailyFeatured = formData.get("is_daily_featured") === "on";
  const accessTier = String(formData.get("access_tier") ?? "subscription") as
    | "subscription"
    | "one_time";
  const priceRupees = accessTier === "one_time" ? Number(formData.get("price_rupees") ?? 0) : null;

  if (!title || !storageKey || !expiresAt) {
    throw new Error("Title, an uploaded file, and an expiry date are all required.");
  }
  if (accessTier === "one_time" && (!priceRupees || priceRupees <= 0)) {
    throw new Error("Pay-per-video content needs a price greater than zero.");
  }

  // Only one video may be today's featured video — clear the previous one
  // rather than letting the DB's unique-index constraint reject the insert.
  if (isDailyFeatured) {
    await supabase.from("videos").update({ is_daily_featured: false }).eq("is_daily_featured", true);
  }

  const { data, error } = await supabase
    .from("videos")
    .insert({
      section_id: sectionId,
      title,
      description,
      storage_key: storageKey,
      duration_seconds: durationSeconds,
      expires_at: new Date(expiresAt).toISOString(),
      is_daily_featured: isDailyFeatured,
      access_tier: accessTier,
      price_rupees: priceRupees,
      status: "live",
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logActivity("create", "videos", data.id);
  revalidatePath(`/sections/${sectionId}`);
}

export async function updateVideo(sectionId: string, videoId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const durationSeconds = Number(formData.get("duration_seconds") ?? 0) || null;
  const expiresAt = String(formData.get("expires_at") ?? "");
  const accessTier = String(formData.get("access_tier") ?? "subscription") as
    | "subscription"
    | "one_time";
  const priceRupees = accessTier === "one_time" ? Number(formData.get("price_rupees") ?? 0) : null;

  if (!title || !expiresAt) {
    throw new Error("Title and an expiry date are required.");
  }
  if (accessTier === "one_time" && (!priceRupees || priceRupees <= 0)) {
    throw new Error("Pay-per-video content needs a price greater than zero.");
  }

  // Editing metadata never touches storage_key — swapping the actual file
  // means uploading a new video, not editing this one.
  const { error } = await supabase
    .from("videos")
    .update({
      title,
      description,
      duration_seconds: durationSeconds,
      expires_at: new Date(expiresAt).toISOString(),
      access_tier: accessTier,
      price_rupees: priceRupees,
    })
    .eq("id", videoId);
  if (error) throw new Error(error.message);

  await logActivity("update", "videos", videoId);
  revalidatePath(`/sections/${sectionId}`);
}

export async function setDailyFeatured(sectionId: string, videoId: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase.from("videos").update({ is_daily_featured: false }).eq("is_daily_featured", true);
  const { error } = await supabase
    .from("videos")
    .update({ is_daily_featured: true })
    .eq("id", videoId);
  if (error) throw new Error(error.message);

  await logActivity("set_daily_featured", "videos", videoId);
  revalidatePath(`/sections/${sectionId}`);
}

export async function expireVideoNow(sectionId: string, videoId: string) {
  await requireAdmin();
  const supabase = await createClient();

  // Marks the row expired immediately; the nightly sweep (or a manual run
  // of the expire-videos function) picks it up and purges the storage object.
  const { error } = await supabase
    .from("videos")
    .update({ status: "expired", expires_at: new Date().toISOString() })
    .eq("id", videoId);
  if (error) throw new Error(error.message);

  await logActivity("expire_now", "videos", videoId);
  revalidatePath(`/sections/${sectionId}`);
}

// There's deliberately no hard-delete action: deleting the row outright
// would leave its file orphaned in storage forever, since only the nightly sweep
// (status in ('live','scheduled') AND expires_at < now()) purges storage.
// "Remove now" in the UI calls expireVideoNow above instead, which the sweep
// will pick up and clean up properly on its next run.
