import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { getSubscriptionPlans } from "../lib/queries";
import { purchasePackageByIdentifier, restorePurchases } from "../lib/purchases";
import type { SubscriptionPlan } from "../types/database";

const PLAN_LABELS: Record<SubscriptionPlan["code"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Subscribe() {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [purchasingCode, setPurchasingCode] = useState<string | null>(null);

  useEffect(() => {
    getSubscriptionPlans().then(setPlans);
  }, []);

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
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Choose a plan</Text>
        <Text style={styles.subheading}>
          Subscribe to unlock every video in every section, for as long as your plan is active.
        </Text>

        {plans.map((plan) => (
          <Pressable
            key={plan.id}
            style={styles.planCard}
            disabled={purchasingCode !== null}
            onPress={() => handlePurchase(plan)}
          >
            <Text style={styles.planLabel}>{PLAN_LABELS[plan.code]}</Text>
            <Text style={styles.planPrice}>{formatPrice(plan.price_cents)}</Text>
            {purchasingCode === plan.code && <ActivityIndicator style={{ marginTop: 8 }} />}
          </Pressable>
        ))}

        <Pressable
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
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 20, gap: 14 },
  heading: { fontSize: 24, fontWeight: "800" },
  subheading: { fontSize: 14, color: "#666", marginBottom: 8 },
  planCard: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
  },
  planLabel: { fontSize: 16, fontWeight: "700" },
  planPrice: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  restoreButton: { alignItems: "center", marginTop: 12 },
  restoreLabel: { color: "#666", fontSize: 14 },
});
