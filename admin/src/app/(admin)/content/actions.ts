"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { requireAdmin, logActivity } from "../../../lib/require-admin";

export async function upsertAppContent(key: string, value: unknown) {
  const { userId } = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("app_content")
    .upsert(
      { key, value, updated_by: userId, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  if (error) throw new Error(error.message);

  await logActivity("update", "app_content", null);
  revalidatePath("/content");
}

export async function updateIntroText(formData: FormData) {
  const text = String(formData.get("home_intro_text") ?? "");
  await upsertAppContent("home_intro_text", text);
}
