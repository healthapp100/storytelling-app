"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { requireAdmin, logActivity } from "../../../lib/require-admin";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createSection(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (!title) throw new Error("Title is required");

  const { data, error } = await supabase
    .from("sections")
    .insert({ title, slug: slugify(title), description, display_order: displayOrder })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logActivity("create", "sections", data.id);
  revalidatePath("/sections");
}

export async function updateSection(sectionId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (!title) throw new Error("Title is required");

  const { error } = await supabase
    .from("sections")
    .update({ title, description, display_order: displayOrder, updated_at: new Date().toISOString() })
    .eq("id", sectionId);
  if (error) throw new Error(error.message);

  await logActivity("update", "sections", sectionId);
  revalidatePath("/sections");
}

// Hard-deletes the section and its videos (cascades at the DB level — see
// migration 0001_init.sql) only when none of those videos have ever been
// individually purchased. A purchase record cascades off its video row, so
// wiping a purchased video would destroy the customer's only proof of that
// transaction. If any video in the section has a purchase on file, the
// whole delete is blocked — those specific videos never hard-delete (see
// deleteVideo in sections/[id]/actions.ts), so remove them there first.
export async function deleteSection(sectionId: string) {
  await requireAdmin();
  const supabase = await createClient();

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
  revalidatePath("/sections");
}
