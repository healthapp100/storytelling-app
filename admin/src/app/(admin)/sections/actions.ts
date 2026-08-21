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

export async function deleteSection(sectionId: string) {
  await requireAdmin();
  const supabase = await createClient();

  // Cascades to that section's videos at the DB level (see migration
  // 0001_init.sql). Their storage files are NOT cleaned up by this — only the
  // nightly expiry sweep purges storage. Fine for reorganizing empty/unused
  // sections; move videos out first if the section is still live.
  const { error } = await supabase.from("sections").delete().eq("id", sectionId);
  if (error) throw new Error(error.message);

  await logActivity("delete", "sections", sectionId);
  revalidatePath("/sections");
}
