import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Pressy } from "../../components/Pressy";
import { AppTextInput } from "../../components/AppTextInput";
import { ErrorState } from "../../components/ErrorState";
import { AdminSectionRow } from "../../components/admin/AdminSectionRow";
import { createSection, updatePlan, upsertAppContent } from "../../lib/adminActions";
import { getAppContent, getAllSubscriptionPlans, getSections } from "../../lib/queries";
import { uploadLocalFileToStorage } from "../../lib/storageUpload";
import * as DocumentPicker from "expo-document-picker";
import { useSession } from "../../lib/session";
import { colors, fonts, radii, shadow, spacing } from "../../lib/theme";
import type { Section, SubscriptionPlan } from "../../types/database";

const PLAN_LABELS: Record<SubscriptionPlan["code"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function AdminDashboard() {
  const { isAdmin, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [introText, setIntroText] = useState("");
  const [introVideoKey, setIntroVideoKey] = useState<string | null>(null);
  const [introUploading, setIntroUploading] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [sectionRows, planRows, introTextRow, introVideoRow] = await Promise.all([
        getSections(),
        getAllSubscriptionPlans(),
        getAppContent("home_intro_text"),
        getAppContent("home_intro_video_key"),
      ]);
      setSections(sectionRows);
      setPlans(planRows);
      setIntroText((introTextRow?.value as string) ?? "");
      setIntroVideoKey((introVideoRow?.value as string) ?? null);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateSection = async () => {
    if (!newTitle.trim()) return;
    setCreatingSection(true);
    try {
      await createSection({ title: newTitle.trim(), description: newDescription.trim() || null, displayOrder: sections.length });
      setNewTitle("");
      setNewDescription("");
      await load();
    } catch (error) {
      Alert.alert("Couldn't create section", error instanceof Error ? error.message : "Try again.");
    } finally {
      setCreatingSection(false);
    }
  };

  const handleSaveIntroText = async () => {
    try {
      await upsertAppContent("home_intro_text", introText);
      Alert.alert("Saved");
    } catch (error) {
      Alert.alert("Couldn't save", error instanceof Error ? error.message : "Try again.");
    }
  };

  const handlePickIntroVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "video/*" });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    setIntroUploading(true);
    try {
      const { storageKey } = await uploadLocalFileToStorage(
        file.uri,
        file.name ?? "intro.mp4",
        file.mimeType ?? "video/mp4"
      );
      await upsertAppContent("home_intro_video_key", storageKey);
      setIntroVideoKey(storageKey);
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setIntroUploading(false);
    }
  };

  const handleSavePlan = async (plan: SubscriptionPlan, priceRupees: number) => {
    try {
      await updatePlan(plan.id, {
        priceRupees,
        revenuecatProductId: plan.revenuecat_product_id,
        active: plan.active,
      });
      Alert.alert("Saved");
    } catch (error) {
      Alert.alert("Couldn't save", error instanceof Error ? error.message : "Try again.");
    }
  };

  if (!sessionLoading && !isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  if (failed) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ErrorState onRetry={load} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Manage</Text>
        <Text style={styles.heading}>Admin</Text>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Sections</Text>
          <View style={styles.list}>
            {sections.map((section) => (
              <AdminSectionRow key={section.id} section={section} onChanged={load} />
            ))}
          </View>
          <View style={styles.addCard}>
            <AppTextInput style={styles.input} placeholder="New section title" value={newTitle} onChangeText={setNewTitle} />
            <AppTextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={newDescription}
              onChangeText={setNewDescription}
            />
            <Pressy style={styles.primaryButton} onPress={handleCreateSection} disabled={creatingSection}>
              <Text style={styles.primaryButtonLabel}>{creatingSection ? "Adding…" : "Add section"}</Text>
            </Pressy>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Pricing</Text>
          <View style={styles.list}>
            {plans.map((plan) => (
              <PlanRow key={plan.id} plan={plan} onSave={(cents) => handleSavePlan(plan, cents)} />
            ))}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Home content</Text>
          <View style={styles.addCard}>
            <AppTextInput
              style={[styles.input, styles.multiline]}
              placeholder="Intro text"
              value={introText}
              onChangeText={setIntroText}
              multiline
            />
            <Pressy style={styles.primaryButton} onPress={handleSaveIntroText}>
              <Text style={styles.primaryButtonLabel}>Save intro text</Text>
            </Pressy>
          </View>
          <View style={styles.addCard}>
            <Text style={styles.currentFile}>Intro video: {introVideoKey ?? "none set"}</Text>
            <Pressy style={styles.secondaryButton} onPress={handlePickIntroVideo} disabled={introUploading}>
              <Text style={styles.secondaryButtonLabel}>
                {introUploading ? "Uploading…" : "Choose a video file"}
              </Text>
            </Pressy>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanRow({ plan, onSave }: { plan: SubscriptionPlan; onSave: (priceRupees: number) => void }) {
  const [value, setValue] = useState(String(plan.price_rupees));

  // Keeps this row in sync if the price changes from elsewhere (another
  // admin, or the realtime refresh after this same save completes) — a
  // plain useState initializer only runs once and would otherwise go
  // stale while this row's component instance stays mounted.
  useEffect(() => {
    setValue(String(plan.price_rupees));
  }, [plan.price_rupees]);

  return (
    <View style={styles.planRow}>
      <Text style={styles.planLabel}>{PLAN_LABELS[plan.code]}</Text>
      <AppTextInput
        style={styles.planInput}
        value={value}
        onChangeText={setValue}
        keyboardType="number-pad"
      />
      <Pressy style={styles.planSaveButton} onPress={() => onSave(Number(value) || 0)}>
        <Text style={styles.planSaveLabel}>Save</Text>
      </Pressy>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heading: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  block: { gap: spacing.sm },
  blockTitle: { fontSize: 13, fontWeight: "700", color: colors.accent, textTransform: "uppercase", letterSpacing: 1 },
  list: { gap: spacing.sm },
  addCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.paperRaised,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  primaryButton: { backgroundColor: colors.night, borderRadius: radii.sm, paddingVertical: 11, alignItems: "center" },
  primaryButtonLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: 11,
    alignItems: "center",
  },
  secondaryButtonLabel: { color: colors.ink, fontWeight: "600", fontSize: 14 },
  currentFile: { fontSize: 13, color: colors.inkMuted },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.paperRaised,
    borderRadius: radii.md,
    padding: spacing.md,
    ...shadow.card,
  },
  planLabel: { flex: 1, fontWeight: "700", color: colors.ink },
  planInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 90,
    fontSize: 14,
    color: colors.ink,
  },
  planSaveButton: { backgroundColor: colors.night, borderRadius: radii.sm, paddingVertical: 8, paddingHorizontal: 12 },
  planSaveLabel: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
