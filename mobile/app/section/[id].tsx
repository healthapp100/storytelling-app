import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { ErrorState } from "../../components/ErrorState";
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
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    getVideosForSection(id)
      .then(setVideos)
      .catch(() => setFailed(true));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable("videos", load, `section_id=eq.${id}`);

  if (failed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState onRetry={load} />
      </SafeAreaView>
    );
  }

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
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="film-outline" size={22} color={colors.inkFaint} />
            <Text style={styles.empty}>No videos here yet — check back soon.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressy
            style={styles.row}
            onPress={() => router.push({ pathname: "/video/[id]", params: { id: item.id } })}
          >
            {item.thumbnail_url ? (
              <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailWrap} />
            ) : (
              <View style={styles.playIconWrap}>
                <Ionicons name="play" size={16} color={colors.accentInk} />
              </View>
            )}
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.rowMeta}>
                {formatDuration(item.duration_seconds)}
                {item.access_tier === "one_time" ? " · Pay per video" : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
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
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  empty: { color: colors.inkFaint, fontSize: 14, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.paperRaised,
    borderRadius: radii.md,
    padding: spacing.md + 2,
    ...shadow.card,
  },
  playIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailWrap: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.accentSoft },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  rowMeta: { fontSize: 13, color: colors.inkMuted },
});
