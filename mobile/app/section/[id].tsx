import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppTextInput } from "../../components/AppTextInput";
import { ErrorState } from "../../components/ErrorState";
import { FadeIn } from "../../components/FadeIn";
import { PageHeading } from "../../components/PageHeading";
import { getVideosForSection } from "../../lib/queries";
import { useRealtimeTable } from "../../lib/realtime";
import { colors, fonts, radii, spacing } from "../../lib/theme";
import type { VideoCatalogEntry } from "../../types/database";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

export default function SectionDetail() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [videos, setVideos] = useState<VideoCatalogEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    setFailed(false);
    return getVideosForSection(id)
      .then(setVideos)
      .catch(() => setFailed(true));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useRealtimeTable("videos", load, `section_id=eq.${id}`);

  const filteredVideos = useMemo(() => {
    if (!videos) return videos;
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => v.title.toLowerCase().includes(q));
  }, [videos, query]);

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
        data={filteredVideos ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View>
            <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12} style={styles.back}>
              <Text style={styles.backLabel}>←  Library</Text>
            </Pressable>
            <PageHeading
              title={title ?? "Stories"}
              subtitle={videos.length > 0 ? `${videos.length} ${videos.length === 1 ? "story" : "stories"}` : undefined}
            />
            {videos.length > 3 && (
              <AppTextInput
                style={styles.search}
                placeholder="Find a story"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
              />
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{query.trim() ? "No match." : "Nothing here yet."}</Text>
            <Text style={styles.emptyText}>
              {query.trim() ? "Try a different word." : "Stories added to this collection will show up here."}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const paid = item.access_tier === "one_time";
          return (
            <FadeIn delay={Math.min(index, 8) * 60}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/video/[id]", params: { id: item.id } })}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                {item.thumbnail_url ? (
                  <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbBlank]}>
                    <Text style={styles.thumbNumeral}>{index + 1}</Text>
                  </View>
                )}
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {formatDuration(item.duration_seconds)}
                    {paid && item.duration_seconds ? "  ·  " : ""}
                    {paid ? <Text style={styles.price}>₹{item.price_rupees ?? 0}</Text> : null}
                  </Text>
                </View>
              </Pressable>
            </FadeIn>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  back: { alignSelf: "flex-start", marginBottom: spacing.md },
  backLabel: { fontSize: 15, fontWeight: "600", color: colors.inkMuted },
  search: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.rule,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.accentSoft },
  thumb: { width: 112, height: 70, borderRadius: radii.sm, backgroundColor: colors.border },
  thumbBlank: { backgroundColor: colors.night, alignItems: "center", justifyContent: "center" },
  thumbNumeral: { fontFamily: fonts.display, fontSize: 28, color: colors.accentSoft },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: fonts.displayMedium, fontSize: 19, lineHeight: 24, color: colors.ink },
  rowMeta: { fontSize: 13.5, color: colors.inkMuted },
  price: { color: colors.accent, fontWeight: "700" },
  empty: { paddingVertical: spacing.lg, gap: 4 },
  emptyTitle: { fontFamily: fonts.displayMedium, fontSize: 20, color: colors.ink },
  emptyText: { fontSize: 14.5, lineHeight: 21, color: colors.inkMuted },
});
