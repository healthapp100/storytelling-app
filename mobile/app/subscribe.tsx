import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Pressy } from "../components/Pressy";
import { getSubscriptionPlans } from "../lib/queries";
import { purchasePackageByIdentifier, restorePurchases } from "../lib/purchases";
import { useRealtimeTable } from "../lib/realtime";
import { colors, fonts, radii, shadow, spacing } from "../lib/theme";
import type { SubscriptionPlan } from "../types/database";

const PLAN_LABELS: Record<SubscriptionPlan["code"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const PLAN_HINTS: Record<SubscriptionPlan["code"], string> = {
  daily: "Try it out for a day",
  weekly: "For a week of stories",
  monthly: "Best value, full month",
};

function formatPrice(cents: number): string {
  return `₹${(cents / 100).toFixed(2)}`;
}

export default function Subscribe() {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [purchasingCode, setPurchasingCode] = useState<string | null>(null);

  const load = useCallback(() => {
    getSubscriptionPlans().then(setPlans);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable("subscription_plans", load);

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!plan.revenuecat_product_id) {
      Alert.alert("Not available yet", "This plan hasn't been connected to the store yet.");
      return;
    }
    setPurchasingCode(plan.code);
    try {
      await purchasePackageByIdentifier(plan.revenuecat_product_id);
      Alert.alert("You're subscribed", "Enjoy today's stories.");
      router.back();
    } catch (error) {
      Alert.alert("Purchase failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setPurchasingCode(null);
    }
  };

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
        <Text style={styles.heading}>Choose a plan</Text>
        <Text style={styles.subheading}>
          Subscribe to unlock every video in every section, for as long as your plan is active.
        </Text>

        {plans.map((plan) => (
          <Pressy
            key={plan.id}
            style={styles.planCard}
            disabled={purchasingCode !== null}
            onPress={() => handlePurchase(plan)}
          >
            <View style={styles.planText}>
              <Text style={styles.planLabel}>{PLAN_LABELS[plan.code]}</Text>
              <Text style={styles.planHint}>{PLAN_HINTS[plan.code]}</Text>
            </View>
            {purchasingCode === plan.code ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.planPrice}>{formatPrice(plan.price_cents)}</Text>
            )}
          </Pressy>
        ))}

        <Pressy
          style={styles.restoreButton}
          onPress={async () => {
            try {
              await restorePurchases();
              Alert.alert("Restored", "Your purchases have been restored.");
            } catch (error) {
              Alert.alert("Nothing to restore", error instanceof Error ? error.message : "");
            }
          }}
        >
          <Text style={styles.restoreLabel}>Restore purchases</Text>
        </Pressy>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  heading: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  subheading: { fontSize: 14.5, color: colors.inkMuted, marginBottom: spacing.sm, lineHeight: 21 },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.paperRaised,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  planText: { gap: 2 },
  planLabel: { fontSize: 17, fontWeight: "700", color: colors.ink },
  planHint: { fontSize: 13, color: colors.inkMuted },
  planPrice: { fontFamily: fonts.display, fontSize: 22, color: colors.accent },
  restoreButton: { alignItems: "center", marginTop: spacing.sm, padding: spacing.sm },
  restoreLabel: { color: colors.inkMuted, fontSize: 14, fontWeight: "600" },
});
