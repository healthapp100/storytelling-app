import { Platform } from "react-native";
import Purchases, { type CustomerInfo, type PurchasesOffering } from "react-native-purchases";
import { getVideoPurchaseTiers } from "./queries";
import { supabase } from "./supabase";
import type { VideoCatalogEntry } from "../types/database";

// react-native-purchases is a native module — this only works in a custom
// dev client / EAS build, not in Expo Go. See mobile/README.md.
let configured = false;

export function configurePurchases(appUserId: string) {
  if (configured) return;
  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  });
  if (!apiKey) {
    console.warn("RevenueCat API key missing — purchases will not work until it's set.");
    return;
  }
  // appUserId = the Supabase user id, so RevenueCat's webhook (see
  // supabase/functions/revenuecat-webhook) can write straight back to the
  // matching user_subscriptions row. See ARCHITECTURE.md §6.
  Purchases.configure({ apiKey, appUserID: appUserId });
  configured = true;
}

export async function logOutPurchases() {
  if (!configured) return;
  await Purchases.logOut();
  configured = false;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

// `storeProductId` here is subscription_plans.revenuecat_product_id — the
// actual App Store/Play Store product ID (e.g. "app.storytelling.monthly").
// That's NOT the same as a RevenueCat Package's own `.identifier` (which is
// an Offering-scoped slug like "$rc_monthly", set inside the RevenueCat
// dashboard) — matching against `pkg.identifier` would silently never find
// anything, since our stored value is a store ID, not a package slug. The
// store product ID lives at `pkg.product.identifier` instead.
export async function purchasePackageByIdentifier(storeProductId: string): Promise<CustomerInfo> {
  const offering = await getCurrentOffering();
  const pkg = offering?.availablePackages.find((p) => p.product.identifier === storeProductId);
  if (!pkg) {
    throw new Error("That plan isn't available for purchase right now.");
  }
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

// Buys a single pay-per-video video. Unlike subscriptions (granted by the
// revenuecat-webhook Edge Function reacting to the product_id alone), a
// video purchase has to name *which* video — many videos can share the same
// ₹49/₹99/₹199 tier product, so only the client, at the moment it starts
// the purchase, knows the answer. This buys the tier product matching the
// video's price, then asks purchase-video to verify the transaction with
// RevenueCat server-side and grant access — see that function's comment for
// the full reasoning.
export async function purchaseVideo(video: VideoCatalogEntry): Promise<void> {
  if (video.access_tier !== "one_time" || !video.price_rupees) {
    throw new Error("This video isn't available for purchase.");
  }
  const tiers = await getVideoPurchaseTiers();
  const tier = tiers.find((t) => t.price_rupees === video.price_rupees);
  if (!tier?.revenuecat_product_id) {
    throw new Error("This video isn't available for purchase right now.");
  }

  const offering = await getCurrentOffering();
  const pkg = offering?.availablePackages.find((p) => p.product.identifier === tier.revenuecat_product_id);
  if (!pkg) {
    throw new Error("This video isn't available for purchase right now.");
  }

  const { productIdentifier, transaction } = await Purchases.purchasePackage(pkg);

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Not signed in.");

  const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/purchase-video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({
      videoId: video.id,
      productId: productIdentifier,
      transactionId: transaction.transactionIdentifier,
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Couldn't confirm the purchase — try again.");
  }
}
