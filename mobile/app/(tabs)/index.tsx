import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ErrorState } from "../../components/ErrorState";
import { Pressy } from "../../components/Pressy";
import { getAppContent, getTodaysVideo, getVideosByIds, storagePublicUrl } from "../../lib/queries";
import { useRealtimeTable } from "../../lib/realtime";
import { getRecentWatchProgress, type WatchProgressEntry } from "../../lib/watchProgress";
import { colors, fonts, radii, shadow, spacing } from "../../lib/theme";
import type { VideoCatalogEntry } from "../../types/database";

type ContinueWatchingItem = VideoCatalogEntry & { progressRatio: number };

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [introText, setIntroText] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);
  const [todaysVideo, setTodaysVideo] = useState<VideoCatalogEntry | null>(null);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);

  const loadContinueWatching = useCallback(async () => {
    const entries = await getRecentWatchProgress();
    if (entries.length === 0) {
      setContinueWatching([]);
      return;
    }
    const videos = await getVideosByIds(entries.map((e) => e.videoId));
    const byId = new Map(entries.map((e) => [e.videoId, e]));
    const merged = videos
      .map((v) => {
        const entry = byId.get(v.id) as WatchProgressEntry;
        return { ...v, progressRatio: entry.position / entry.duration };
      })
      .sort((a, b) => (byId.get(b.id)?.updatedAt ?? 0) - (byId.get(a.id)?.updatedAt ?? 0));
    setContinueWatching(merged);
  }, []);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [about, introKey, today] = await Promise.all([
        getAppContent("home_intro_text"),
        getAppContent("home_intro_video_key"),
        getTodaysVideo(),
        loadContinueWatching(),
      ]);
      setIntroText((about?.value as string) ?? "");
      setIntroVideoUrl(introKey?.value ? storagePublicUrl(introKey.value as string) : null);
      setTodaysVideo(today);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [loadContinueWatching]);

  useEffect(() => {
    load();
  }, [load]);

  // Progress made just now on the video screen wouldn't otherwise show up
  // here until the next full load — refresh the Continue Watching row every
  // time this tab regains focus (e.g. backing out of a video).
  useFocusEffect(
    useCallback(() => {
      loadContinueWatching();
    }, [loadContinueWatching])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Live refresh: an admin publishing a new "today's video" or editing the
  // intro copy shows up here without the user needing to reopen the app.
  useRealtimeTable("videos", load);
  useRealtimeTable("app_content", load);

  const introPlayer = useVideoPlayer(introVideoUrl ?? "", (player) => {
    player.loop = true;
  });

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
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.headerRow}>
          <View style={styles.flex1}>
            <Text style={styles.eyebrow}>Every day, a new story</Text>
            <Text style={styles.heading}>Storytelling</Text>
          </View>
          <View style={styles.brandMark}>
            <Ionicons name="flame" size={20} color={colors.accent} />
          </View>
        </View>
        {introText ? <Text style={styles.intro}>{introText}</Text> : null}

        {todaysVideo ? (
          <Pressy
            style={styles.todayCardWrap}
            onPress={() => router.push({ pathname: "/video/[id]", params: { id: todaysVideo.id } })}
          >
            <ImageBackground
              source={todaysVideo.thumbnail_url ? { uri: todaysVideo.thumbnail_url } : undefined}
              style={styles.todayCard}
              imageStyle={styles.todayCardImage}
            >
              {todaysVideo.thumbnail_url && <View style={styles.todayCardScrim} />}
              <View style={styles.todayLabelRow}>
                <Ionicons name="sparkles" size={13} color={colors.accentSoft} />
                <Text style={styles.todayLabel}>Today&apos;s story</Text>
              </View>
              <Text style={styles.todayTitle}>{todaysVideo.title}</Text>
              <View style={styles.todayCtaRow}>
                <Text style={styles.todayCta}>
                  {todaysVideo.access_tier === "one_time"
                    ? `₹${todaysVideo.price_rupees ?? 0} to unlock`
                    : "Watch now"}
                </Text>
                <Ionicons name="arrow-forward" size={16} color={colors.accent} />
              </View>
            </ImageBackground>
          </Pressy>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="moon-outline" size={22} color={colors.inkFaint} />
            <Text style={styles.emptyText}>No story featured yet today — check back soon.</Text>
          </View>
        )}

        {continueWatching.length > 0 && (
          <View style={styles.continueWrap}>
            <Text style={styles.sectionLabel}>Continue watching</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.continueRow}>
              {continueWatching.map((item) => (
                <Pressy
                  key={item.id}
                  style={styles.continueCard}
                  onPress={() => router.push({ pathname: "/video/[id]", params: { id: item.id } })}
                >
                  {item.thumbnail_url ? (
                    <Image source={{ uri: item.thumbnail_url }} style={styles.continueThumb} />
                  ) : (
                    <View style={[styles.continueThumb, styles.continueThumbPlaceholder]}>
                      <Ionicons name="play" size={18} color={colors.accentInk} />
                    </View>
                  )}
                  <View style={styles.continueProgressTrack}>
                    <View style={[styles.continueProgressFill, { width: `${Math.round(item.progressRatio * 100)}%` }]} />
                  </View>
                  <Text style={styles.continueTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </Pressy>
              ))}
            </ScrollView>
          </View>
        )}

        {introVideoUrl && (
          <View style={styles.introVideoWrap}>
            <Text style={styles.sectionLabel}>About this app</Text>
            <VideoView style={styles.introVideo} player={introPlayer} contentFit="cover" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  flex1: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heading: { fontFamily: fonts.display, fontSize: 34, color: colors.ink },
  intro: { fontSize: 15.5, color: colors.inkMuted, lineHeight: 23 },
  todayCardWrap: { borderRadius: radii.lg, ...shadow.card },
  todayCard: {
    backgroundColor: colors.night,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    overflow: "hidden",
  },
  todayCardImage: { borderRadius: radii.lg },
  todayCardScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(33, 27, 54, 0.72)",
  },
  todayLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  todayLabel: { color: colors.accentSoft, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: "700" },
  todayTitle: { color: "#fff", fontFamily: fonts.display, fontSize: 22, marginTop: 2 },
  todayCtaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md },
  todayCta: { color: "#fff", fontWeight: "700", fontSize: 15 },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderStyle: "dashed",
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyText: { color: colors.inkFaint, fontSize: 14, textAlign: "center" },
  continueWrap: { gap: spacing.sm },
  continueRow: { gap: spacing.sm, paddingRight: spacing.lg },
  continueCard: { width: 140, gap: 6 },
  continueThumb: { width: 140, height: 84, borderRadius: radii.md, backgroundColor: colors.accentSoft },
  continueThumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  continueProgressTrack: { height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" },
  continueProgressFill: { height: 3, backgroundColor: colors.accent },
  continueTitle: { fontSize: 13, fontWeight: "600", color: colors.ink },
  introVideoWrap: { gap: spacing.sm },
  sectionLabel: { fontSize: 13, color: colors.inkMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  introVideo: { width: "100%", aspectRatio: 16 / 9, borderRadius: radii.md, backgroundColor: colors.night },
});
