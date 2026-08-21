import { createClient } from "../../../lib/supabase/server";
import type { SubscriptionPlan } from "../../../types/database";
import { updatePlan } from "./actions";

const PLAN_LABELS: Record<SubscriptionPlan["code"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("duration_days")
    .returns<SubscriptionPlan[]>();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Pricing</h1>
        <p className="mt-1 text-sm text-stone-500">
          These prices are what your database thinks a plan costs. The store product IDs must
          also exist in App Store Connect / Play Console with matching prices — RevenueCat reads
          from the store, not from here. See ARCHITECTURE.md §6.
        </p>
      </div>

      <div className="space-y-4">
        {(plans ?? []).map((plan) => (
          <form
            key={plan.id}
            action={updatePlan.bind(null, plan.id)}
            className="space-y-3 rounded-lg border border-stone-200 bg-white p-4"
          >
            <h2 className="text-sm font-semibold text-stone-900">{PLAN_LABELS[plan.code]}</h2>
            <label className="block text-sm text-stone-700">
              Price (in cents)
              <input
                name="price_cents"
                type="number"
                defaultValue={plan.price_cents}
                required
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm text-stone-700">
              RevenueCat product ID
              <input
                name="revenuecat_product_id"
                defaultValue={plan.revenuecat_product_id ?? ""}
                placeholder="e.g. app.storytelling.monthly"
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="active" defaultChecked={plan.active} />
              Active
            </label>
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            >
              Save
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
