import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
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
  const { session } = useSession();
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{initialFor(profile?.display_name ?? null, identifier)}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{profile?.display_name || "Your account"}</Text>
            <Text style={styles.identifier}>{identifier}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressy style={styles.subscribeButton} onPress={() => router.push("/subscribe")}>
            <Text style={styles.subscribeLabel}>Manage subscription</Text>
          </Pressy>

          <Pressy
            style={styles.signOutButton}
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/sign-in");
            }}
          >
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
  container: { flex: 1, padding: spacing.lg, gap: spacing.xl },
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
  identityText: { gap: 2 },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  identifier: { fontSize: 14, color: colors.inkMuted },
  actions: { gap: spacing.sm },
  subscribeButton: {
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  subscribeLabel: { color: "#fff", fontWeight: "700", fontSize: 15 },
  signOutButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.paperRaised,
  },
  signOutLabel: { fontWeight: "600", color: colors.ink },
  debugButton: { alignItems: "center", padding: spacing.sm },
  debugLabel: { color: colors.inkFaint, fontSize: 12 },
});
