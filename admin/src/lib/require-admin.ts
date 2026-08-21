import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "../types/database";

// Middleware only guarantees "signed in" — this enforces "signed in as
// admin" for every page under (admin)/. RLS backs this up at the DB layer
// too, so a bypass here still can't mutate anything.
export async function requireAdmin(): Promise<{ profile: Profile; userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/login?error=not-admin");
  }

  return { profile, userId: user.id };
}

export async function logActivity(
  action: string,
  targetTable: string,
  targetId: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("admin_activity_log").insert({
    admin_id: user.id,
    action,
    target_table: targetTable,
    target_id: targetId,
  });
}
