"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { requireAdmin, logActivity } from "../../../lib/require-admin";

export async function updatePlan(planId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const priceRupees = Number(formData.get("price_rupees") ?? 0);
  const revenuecatProductId = String(formData.get("revenuecat_product_id") ?? "").trim() || null;
  const active = formData.get("active") === "on";

  if (priceRupees <= 0) throw new Error("Price must be greater than zero.");

  const { error } = await supabase
    .from("subscription_plans")
    .update({ price_rupees: priceRupees, revenuecat_product_id: revenuecatProductId, active })
    .eq("id", planId);
  if (error) throw new Error(error.message);

  await logActivity("update", "subscription_plans", planId);
  revalidatePath("/pricing");
}
