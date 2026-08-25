import { createClient } from "../../../lib/supabase/server";
import type { SubscriptionPlan } from "../../../types/database";
import { updatePlan } from "./actions";

const PLAN_LABELS: Record<SubscriptionPlan["code"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink transition-colors focus:border-accent focus:outline-none";

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
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Billing</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Pricing</h1>
        <p className="mt-2 text-sm text-ink-muted">
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
            className="space-y-3 rounded-xl border border-border bg-paper-raised p-5"
          >
            <h2 className="font-display text-lg text-ink">{PLAN_LABELS[plan.code]}</h2>
            <label className="block text-sm text-ink-muted">
              Price (in ₹ — whole rupees, e.g. 199)
              <input
                name="price_rupees"
                type="number"
                defaultValue={plan.price_rupees}
                required
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-ink-muted">
              RevenueCat product ID
              <input
                name="revenuecat_product_id"
                defaultValue={plan.revenuecat_product_id ?? ""}
                placeholder="e.g. app.storytelling.monthly"
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" name="active" defaultChecked={plan.active} className="accent-accent" />
              Active
            </label>
            <button
              type="submit"
              className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-ink"
            >
              Save
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
