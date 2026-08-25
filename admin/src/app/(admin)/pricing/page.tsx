import { createClient } from "../../../lib/supabase/server";
import type { SubscriptionPlan, VideoPurchaseTier } from "../../../types/database";
import { updatePlan, updateVideoPurchaseTier } from "./actions";

const PLAN_LABELS: Record<SubscriptionPlan["code"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink transition-colors focus:border-accent focus:outline-none";

export default async function PricingPage() {
  const supabase = await createClient();
  const [{ data: plans }, { data: tiers }] = await Promise.all([
    supabase.from("subscription_plans").select("*").order("duration_days").returns<SubscriptionPlan[]>(),
    supabase.from("video_purchase_tiers").select("*").order("price_rupees").returns<VideoPurchaseTier[]>(),
  ]);

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

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Pay-per-video</p>
        <h2 className="mt-1 font-display text-2xl text-ink">Purchase tiers</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Real store purchases need a fixed product per price point, not a dynamic price per video —
          a pay-per-video video&apos;s price must match one of these tiers. Set up a matching
          consumable product in App Store Connect / Play Console and RevenueCat, then paste its
          product ID below.
        </p>
      </div>

      <div className="space-y-4">
        {(tiers ?? []).map((tier) => (
          <form
            key={tier.id}
            action={updateVideoPurchaseTier.bind(null, tier.id)}
            className="space-y-3 rounded-xl border border-border bg-paper-raised p-5"
          >
            <h2 className="font-display text-lg text-ink">₹{tier.price_rupees}</h2>
            <label className="block text-sm text-ink-muted">
              RevenueCat product ID
              <input
                name="revenuecat_product_id"
                defaultValue={tier.revenuecat_product_id ?? ""}
                placeholder="e.g. app.storytelling.video99"
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" name="active" defaultChecked={tier.active} className="accent-accent" />
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
