import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pressy } from "../../components/Pressy";
import { signOut } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { Sentry } from "../../lib/sentry";
import { useSession } from "../../lib/session";
import { colors, fonts, radii, shadow, spacing } from "../../lib/theme";
import type { Profile } from "../../types/database";

function initialFor(name: string | null, fallback: string): string {
  const source = name?.trim() || fallback;
  return source.charAt(0).toUpperCase() || "?";
}

export default function ProfileScreen() {
  const { session, isAdmin } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [session]);

  const identifier = profile?.email ?? profile?.phone ?? "";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Your account</Text>

        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{initialFor(profile?.display_name ?? null, identifier)}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{profile?.display_name || "Your account"}</Text>
            <Text style={styles.identifier}>{identifier}</Text>
          </View>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.accentInk} />
              <Text style={styles.adminBadgeLabel}>Admin</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Pressy style={styles.subscribeButton} onPress={() => router.push("/subscribe")}>
            <Ionicons name="star" size={17} color="#fff" />
            <Text style={styles.subscribeLabel}>Manage subscription</Text>
          </Pressy>

          <Pressy
            style={styles.signOutButton}
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/sign-in");
            }}
          >
            <Ionicons name="log-out-outline" size={17} color={colors.ink} />
            <Text style={styles.signOutLabel}>Sign out</Text>
          </Pressy>

          {__DEV__ && (
            <Pressy
              style={styles.debugButton}
              onPress={() => {
                Sentry.captureException(new Error("Test error from Profile screen"));
              }}
            >
              <Text style={styles.debugLabel}>Send test error to Sentry (dev only)</Text>
            </Pressy>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  container: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.paperRaised,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: { fontFamily: fonts.display, fontSize: 22, color: colors.accentInk },
  identityText: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  identifier: { fontSize: 14, color: colors.inkMuted },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  adminBadgeLabel: { fontSize: 11, fontWeight: "700", color: colors.accentInk },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  subscribeButton: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.night,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeLabel: { color: "#fff", fontWeight: "700", fontSize: 15 },
  signOutButton: {
    flexDirection: "row",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paperRaised,
  },
  signOutLabel: { fontWeight: "600", color: colors.ink },
  debugButton: { alignItems: "center", padding: spacing.sm },
  debugLabel: { color: colors.inkFaint, fontSize: 12 },
});
