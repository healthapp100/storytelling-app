import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ErrorState } from "../components/ErrorState";
import { FadeIn } from "../components/FadeIn";
import { PageHeading } from "../components/PageHeading";
import { getSubscriptionPlans } from "../lib/queries";
import { purchasePackageByIdentifier, restorePurchases } from "../lib/purchases";
import { useRealtimeTable } from "../lib/realtime";
import { useToast } from "../lib/toast";
import { colors, fonts, spacing } from "../lib/theme";
import type { SubscriptionPlan } from "../types/database";

const PLAN_LABELS: Record<SubscriptionPlan["code"], string> = {
  daily: "One day",
  weekly: "One week",
  monthly: "One month",
};

const PLAN_HINTS: Record<SubscriptionPlan["code"], string> = {
  daily: "A single day of stories, to try it out",
  weekly: "Seven days, every collection",
  monthly: "The best value — a full month",
};

export default function Subscribe() {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [purchasingCode, setPurchasingCode] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(() => {
    setFailed(false);
    getSubscriptionPlans()
      .then(setPlans)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable("subscription_plans", load);

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!plan.revenuecat_product_id) return;
    setPurchasingCode(plan.code);
    try {
      await purchasePackageByIdentifier(plan.revenuecat_product_id);
      showToast("You're subscribed. Enjoy the stories.", "celebrate");
      router.back();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Purchase failed — try again.", "error");
    } finally {
      setPurchasingCode(null);
    }
  };

  if (failed) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <ErrorState onRetry={load} />
      </SafeAreaView>
    );
  }

  if (!plans) {
    return (
      <SafeAreaView style={styles.center} edges={["bottom", "left", "right"]}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <PageHeading title="Plans" subtitle="Every story in every collection, for as long as your plan runs." />

        <View style={styles.list}>
          {plans.map((plan, index) => {
            const comingSoon = !plan.revenuecat_product_id;
            const busy = purchasingCode === plan.code;
            return (
              <FadeIn key={plan.id} delay={index * 80}>
                <Pressable
                  accessibilityRole="button"
                  disabled={purchasingCode !== null || comingSoon}
                  onPress={() => handlePurchase(plan)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed, comingSoon && styles.rowMuted]}
                >
                  <View style={styles.priceCol}>
                    {busy ? (
                      <ActivityIndicator color={colors.accent} />
                    ) : (
                      <Text style={styles.price}>
                        <Text style={styles.rupee}>₹</Text>
                        {plan.price_rupees}
                      </Text>
                    )}
                  </View>
                  <View style={styles.planText}>
                    <Text style={styles.planLabel}>{PLAN_LABELS[plan.code]}</Text>
                    <Text style={styles.planHint}>{comingSoon ? "Coming soon" : PLAN_HINTS[plan.code]}</Text>
                  </View>
                </Pressable>
              </FadeIn>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.restore}
          onPress={async () => {
            try {
              await restorePurchases();
              showToast("Your purchases have been restored.", "success");
            } catch (error) {
              showToast(error instanceof Error ? error.message : "Nothing to restore.", "error");
            }
          }}
        >
          <Text style={styles.restoreLabel}>Already subscribed? Restore purchases</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  list: { borderTopWidth: 1, borderTopColor: colors.border },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.accentSoft },
  rowMuted: { opacity: 0.55 },
  priceCol: { width: 92, minHeight: 44, justifyContent: "center" },
  price: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: colors.ink },
  rupee: { fontSize: 22, color: colors.accent },
  planText: { flex: 1, gap: 2 },
  planLabel: { fontFamily: fonts.displayMedium, fontSize: 21, color: colors.ink },
  planHint: { fontSize: 14, lineHeight: 20, color: colors.inkMuted },
  restore: { alignSelf: "flex-start", marginTop: spacing.xl, paddingVertical: spacing.sm },
  restoreLabel: { fontSize: 14.5, fontWeight: "600", color: colors.inkMuted, textDecorationLine: "underline" },
});
