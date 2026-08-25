import { Platform } from "react-native";
import Purchases, { type CustomerInfo, type PurchasesOffering } from "react-native-purchases";

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
