// Grants access to a pay-per-video video after a genuine store purchase.
//
// Why this exists instead of the RevenueCat webhook (see
// revenuecat-webhook/index.ts) handling it: that webhook maps a purchased
// product_id straight to a row (one product = one subscription plan). A
// pay-per-video product can't work that way — many different videos can
// share the same ₹49/₹99/₹199 tier product, so the product_id alone never
// tells you *which* video the user meant to unlock. Only the client knows
// that, at the moment it starts the purchase.
//
// So the client (mobile/lib/purchases.ts purchaseVideo()) buys the tier
// product for the video's price via RevenueCat, then calls this function
// with the video id and the resulting transaction id. This function is the
// only thing that actually writes the video_purchases row — it re-verifies
// the transaction against RevenueCat's own records server-side rather than
// trusting the client's claim that a purchase happened, so a compromised or
// modified client can't grant itself free videos.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
// RevenueCat's server-side Secret API key (Project Settings → API Keys →
// Secret keys in the RevenueCat dashboard) — distinct from the app's public
// SDK keys and from REVENUECAT_WEBHOOK_SECRET used by revenuecat-webhook.
const REVENUECAT_SECRET_KEY = Deno.env.get("REVENUECAT_SECRET_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type RequestBody = {
  videoId: string;
  productId: string;
  transactionId: string;
};

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Not signed in." }), { status: 401 });
  }

  // Verifies the caller's own session token — this is what ties the
  // purchase to a specific user_id, so it must come from the request's own
  // Authorization header, never from the request body.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Not signed in." }), { status: 401 });
  }
  const userId = userData.user.id;

  const body: RequestBody = await req.json();
  if (!body.videoId || !body.productId || !body.transactionId) {
    return new Response(JSON.stringify({ error: "Missing videoId, productId, or transactionId." }), {
      status: 400,
    });
  }

  const { data: video, error: videoError } = await admin
    .from("videos")
    .select("id, price_rupees, access_tier, status")
    .eq("id", body.videoId)
    .maybeSingle();
  if (videoError || !video || video.access_tier !== "one_time" || video.status !== "live") {
    return new Response(JSON.stringify({ error: "This video isn't available for purchase." }), {
      status: 400,
    });
  }

  const { data: tier } = await admin
    .from("video_purchase_tiers")
    .select("price_rupees")
    .eq("revenuecat_product_id", body.productId)
    .eq("active", true)
    .maybeSingle();
  // The purchased product's tier price must match this video's price —
  // otherwise someone could buy the cheapest tier and use its transaction
  // id to unlock an expensive video.
  if (!tier || tier.price_rupees !== video.price_rupees) {
    return new Response(JSON.stringify({ error: "That purchase doesn't match this video's price." }), {
      status: 400,
    });
  }

  // Confirms the transaction is real by asking RevenueCat directly, rather
  // than trusting the client's say-so.
  const rcResponse = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
    headers: { Authorization: `Bearer ${REVENUECAT_SECRET_KEY}` },
  });
  if (!rcResponse.ok) {
    return new Response(JSON.stringify({ error: "Couldn't verify that purchase — try again." }), {
      status: 502,
    });
  }
  const rcData = await rcResponse.json();
  const nonSubscriptions = rcData?.subscriber?.non_subscriptions?.[body.productId] ?? [];
  const matchingTransaction = nonSubscriptions.find(
    (entry: { id: string }) => entry.id === body.transactionId
  );
  if (!matchingTransaction) {
    return new Response(JSON.stringify({ error: "Couldn't verify that purchase — try again." }), {
      status: 400,
    });
  }

  const { error: insertError } = await admin.from("video_purchases").insert({
    user_id: userId,
    video_id: body.videoId,
    price_paid_rupees: video.price_rupees,
    store_transaction_id: body.transactionId,
  });
  if (insertError) {
    // unique(user_id, video_id) or the store_transaction_id unique index —
    // either way, this purchase was already granted, which is a success
    // from the client's point of view, not an error to surface.
    if (insertError.code === "23505") {
      return new Response(JSON.stringify({ ok: true, alreadyGranted: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
