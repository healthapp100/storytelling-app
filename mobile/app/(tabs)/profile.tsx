import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, type ReactNode } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FadeIn } from "../../components/FadeIn";
import { PageHeading } from "../../components/PageHeading";
import { signOut } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { Sentry } from "../../lib/sentry";
import { useSession } from "../../lib/session";
import { colors, fonts, spacing } from "../../lib/theme";
import type { Profile } from "../../types/database";

const LEGAL_URL = process.env.EXPO_PUBLIC_LEGAL_URL;

function Row({ label, hint, onPress, danger }: { label: string; hint?: string; onPress: () => void; danger?: boolean }): ReactNode {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Text style={styles.rowArrow}>→</Text>
    </Pressable>
  );
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
      <ScrollView contentContainerStyle={styles.container}>
        <FadeIn>
          <PageHeading title={profile?.display_name || "Your account"} subtitle={identifier || undefined} />
          {isAdmin ? <Text style={styles.adminNote}>You are signed in as an administrator.</Text> : null}
        </FadeIn>

        <FadeIn delay={100}>
          <View style={styles.list}>
            <Row label="Plans & subscription" hint="Choose or manage how you watch" onPress={() => router.push("/subscribe")} />
            {LEGAL_URL ? (
              <>
                <Row label="Terms of Service" onPress={() => Linking.openURL(`${LEGAL_URL}/terms`)} />
                <Row label="Privacy Policy" onPress={() => Linking.openURL(`${LEGAL_URL}/privacy`)} />
              </>
            ) : null}
            <Row
              label="Sign out"
              danger
              onPress={async () => {
                await signOut();
                router.replace("/(auth)/sign-in");
              }}
            />
            {__DEV__ ? (
              <Row
                label="Send a test error to Sentry"
                hint="Development builds only"
                onPress={() => Sentry.captureException(new Error("Test error from Profile screen"))}
              />
            ) : null}
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  container: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  adminNote: { fontSize: 14, color: colors.accent, fontWeight: "600", marginBottom: spacing.md, marginTop: -spacing.sm },
  list: { borderTopWidth: 1, borderTopColor: colors.border },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.accentSoft },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: fonts.displayMedium, fontSize: 20, color: colors.ink },
  rowHint: { fontSize: 13.5, color: colors.inkMuted },
  rowArrow: { fontSize: 18, color: colors.inkFaint },
});
