import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { signOut } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/session";
import type { Profile } from "../../types/database";

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.name}>{profile?.display_name ?? "Your account"}</Text>
        <Text style={styles.identifier}>{profile?.email ?? profile?.phone ?? ""}</Text>

        <Pressable style={styles.subscribeButton} onPress={() => router.push("/subscribe")}>
          <Text style={styles.subscribeLabel}>Manage subscription</Text>
        </Pressable>

        <Pressable
          style={styles.signOutButton}
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/sign-in");
          }}
        >
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 20, gap: 6 },
  name: { fontSize: 22, fontWeight: "800" },
  identifier: { fontSize: 15, color: "#666", marginBottom: 24 },
  subscribeButton: {
    backgroundColor: "#111",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  subscribeLabel: { color: "#fff", fontWeight: "700" },
  signOutButton: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutLabel: { fontWeight: "600" },
});
