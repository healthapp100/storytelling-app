import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Pressy } from "../../components/Pressy";
import { getVideosForSection } from "../../lib/queries";
import { useRealtimeTable } from "../../lib/realtime";
import { colors, fonts, radii, shadow, spacing } from "../../lib/theme";
import type { Video } from "../../types/database";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

export default function SectionDetail() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [videos, setVideos] = useState<Video[] | null>(null);

  const load = useCallback(() => {
    getVideosForSection(id).then(setVideos);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable("videos", load, `section_id=eq.${id}`);

  if (!videos) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Section</Text>
            <Text style={styles.heading}>{title ?? "Videos"}</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No videos here yet — check back soon.</Text>}
        renderItem={({ item }) => (
          <Pressy
            style={styles.row}
            onPress={() => router.push({ pathname: "/video/[id]", params: { id: item.id } })}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>
                {formatDuration(item.duration_seconds)}
                {item.access_tier === "one_time" ? " · Pay per video" : ""}
              </Text>
            </View>
            <Text style={styles.rowArrow}>→</Text>
          </Pressy>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.md },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heading: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  empty: { color: colors.inkFaint, fontSize: 14, marginTop: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.paperRaised,
    borderRadius: radii.md,
    padding: spacing.md + 2,
    ...shadow.card,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  rowMeta: { fontSize: 13, color: colors.inkMuted },
  rowArrow: { color: colors.accent, fontSize: 16, fontWeight: "700" },
});
