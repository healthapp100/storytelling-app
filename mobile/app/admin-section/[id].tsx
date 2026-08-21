import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { AdminVideoRow } from "../../components/admin/AdminVideoRow";
import { AdminVideoUploadForm } from "../../components/admin/AdminVideoUploadForm";
import { getAllVideosForSectionAdmin } from "../../lib/queries";
import { useSession } from "../../lib/session";
import { colors, fonts, spacing } from "../../lib/theme";
import type { Video } from "../../types/database";

export default function AdminSectionDetail() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { isAdmin, loading: sessionLoading } = useSession();
  const [videos, setVideos] = useState<Video[] | null>(null);

  const load = useCallback(() => {
    getAllVideosForSectionAdmin(id).then(setVideos);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!sessionLoading && !isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  if (!videos) {
    return (
      <SafeAreaView style={styles.center} edges={["bottom", "left", "right"]}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <Stack.Screen options={{ title: title ?? "Videos" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>{title ?? "Videos"}</Text>

        <View style={styles.list}>
          {videos.map((video) => (
            <AdminVideoRow key={video.id} video={video} onChanged={load} />
          ))}
          {videos.length === 0 && <Text style={styles.empty}>No videos in this section yet.</Text>}
        </View>

        <AdminVideoUploadForm sectionId={id} onUploaded={load} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  heading: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  list: { gap: spacing.sm },
  empty: { color: colors.inkFaint, fontSize: 14 },
});
