// Receives RevenueCat webhook events and syncs entitlement state into
// user_subscriptions. See ARCHITECTURE.md §6.
//
// Configure this URL + the shared secret below in the RevenueCat dashboard
// under Project Settings → Integrations → Webhooks.
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET")!;

type RevenueCatEvent = {
  event: {
    type: string; // INITIAL_PURCHASE | RENEWAL | CANCELLATION | EXPIRATION | ...
    app_user_id: string; // maps to auth.users.id (set at RevenueCat login time)
    product_id: string;
    store: "APP_STORE" | "PLAY_STORE";
    expiration_at_ms: number | null;
  };
};

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload: RevenueCatEvent = await req.json();
  const { event } = payload;

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("revenuecat_product_id", event.product_id)
    .maybeSingle();

  if (!plan) {
    return new Response(JSON.stringify({ ignored: true, reason: "unknown product_id" }), {
      status: 200,
    });
  }

  const store = event.store === "APP_STORE" ? "app_store" : "play_store";
  // CANCELLATION only means auto-renew was turned off — the user is still
  // entitled to access until their current paid period actually ends. Only
  // EXPIRATION means that access has genuinely ended. Treating CANCELLATION
  // as an immediate expiry (as an earlier version of this did) would cut
  // off access mid-period for anyone who cancels auto-renew, which is most
  // people who cancel at all. has_active_subscription() in 0009 checks
  // expires_at, not just status, so 'cancelled' still grants access until
  // that date passes.
  const status: "active" | "expired" | "cancelled" =
    event.type === "EXPIRATION" ? "expired" : event.type === "CANCELLATION" ? "cancelled" : "active";

  await supabase
    .from("user_subscriptions")
    .upsert(
      {
        user_id: event.app_user_id,
        plan_id: plan.id,
        expires_at: event.expiration_at_ms
          ? new Date(event.expiration_at_ms).toISOString()
          : new Date().toISOString(),
        status,
        store,
        revenuecat_entitlement_id: event.product_id,
      },
      { onConflict: "user_id,plan_id" }
    );

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
