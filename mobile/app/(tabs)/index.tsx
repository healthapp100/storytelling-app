import { useVideoPlayer, VideoView } from "expo-video";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { ErrorState } from "../../components/ErrorState";
import { FadeIn } from "../../components/FadeIn";
import { PageHeading } from "../../components/PageHeading";
import { Pressy } from "../../components/Pressy";
import { getAppContent, getTodaysVideo, getVideosByIds, storagePublicUrl } from "../../lib/queries";
import { useRealtimeTable } from "../../lib/realtime";
import { useSession } from "../../lib/session";
import { getRecentWatchProgress, type WatchProgressEntry } from "../../lib/watchProgress";
import { colors, fonts, radii, spacing } from "../../lib/theme";
import type { VideoCatalogEntry } from "../../types/database";

type ContinueWatchingItem = VideoCatalogEntry & { progressRatio: number };

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { profile } = useSession();
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

  const now = new Date();
  const firstName = profile?.display_name?.trim().split(/\s+/)[0];
  const dateLine = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <FadeIn>
          <Text style={styles.dateLine}>{dateLine}</Text>
          <PageHeading title={firstName ? `${greetingFor(now)},\n${firstName}.` : `${greetingFor(now)}.`} />
        </FadeIn>

        {introText ? (
          <FadeIn delay={80}>
            <Text style={styles.intro}>{introText}</Text>
          </FadeIn>
        ) : null}

        <FadeIn delay={160}>
          {todaysVideo ? (
            <Pressy
              scaleTo={0.985}
              onPress={() => router.push({ pathname: "/video/[id]", params: { id: todaysVideo.id } })}
            >
              {todaysVideo.thumbnail_url ? (
                <Image source={{ uri: todaysVideo.thumbnail_url }} style={styles.todayImage} />
              ) : null}
              <View style={[styles.plate, !todaysVideo.thumbnail_url && styles.plateAlone]}>
                <Text style={styles.plateLabel}>Today&apos;s story</Text>
                <Text style={styles.plateTitle}>{todaysVideo.title}</Text>
                <Text style={styles.plateCta}>
                  {todaysVideo.access_tier === "one_time"
                    ? `₹${todaysVideo.price_rupees ?? 0} to unlock  →`
                    : "Watch now  →"}
                </Text>
              </View>
            </Pressy>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing featured today.</Text>
              <Text style={styles.emptyText}>A new story will appear here as soon as it&apos;s published.</Text>
            </View>
          )}
        </FadeIn>

        {continueWatching.length > 0 && (
          <FadeIn delay={240} style={styles.block}>
            <Text style={styles.blockTitle}>Pick up where you left off</Text>
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
                    <View style={[styles.continueThumb, styles.continueThumbBlank]} />
                  )}
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.round(item.progressRatio * 100)}%` }]} />
                  </View>
                  <Text style={styles.continueTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </Pressy>
              ))}
            </ScrollView>
          </FadeIn>
        )}

        {introVideoUrl && (
          <FadeIn delay={320} style={styles.block}>
            <Text style={styles.blockTitle}>About this app</Text>
            <VideoView style={styles.introVideo} player={introPlayer} contentFit="cover" />
          </FadeIn>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  container: { padding: spacing.lg, gap: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  dateLine: { fontSize: 14, color: colors.inkMuted, marginBottom: 6 },
  intro: {
    fontSize: 16,
    lineHeight: 25,
    color: colors.ink,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    paddingLeft: spacing.md,
  },
  todayImage: { width: "100%", aspectRatio: 16 / 10, borderTopLeftRadius: radii.md, borderTopRightRadius: radii.md, backgroundColor: colors.border },
  plate: {
    backgroundColor: colors.night,
    padding: spacing.lg,
    gap: 6,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
  },
  plateAlone: { borderRadius: radii.md, paddingVertical: spacing.xl },
  plateLabel: { color: colors.accentSoft, fontSize: 13, opacity: 0.85 },
  plateTitle: { color: colors.cream, fontFamily: fonts.display, fontSize: 27, lineHeight: 32 },
  plateCta: { color: colors.accentSoft, fontSize: 15, fontWeight: "600", marginTop: spacing.sm },
  empty: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: spacing.lg, gap: 4 },
  emptyTitle: { fontFamily: fonts.displayMedium, fontSize: 20, color: colors.ink },
  emptyText: { fontSize: 14.5, lineHeight: 21, color: colors.inkMuted },
  block: { gap: spacing.md, marginTop: spacing.sm },
  blockTitle: { fontFamily: fonts.displayMedium, fontSize: 22, color: colors.ink },
  continueRow: { gap: spacing.md, paddingRight: spacing.lg },
  continueCard: { width: 152, gap: 6 },
  continueThumb: { width: 152, height: 96, borderRadius: radii.sm, backgroundColor: colors.border },
  continueThumbBlank: { backgroundColor: colors.nightRaised },
  progressTrack: { height: 3, backgroundColor: colors.border },
  progressFill: { height: 3, backgroundColor: colors.accent },
  continueTitle: { fontSize: 14, lineHeight: 19, fontWeight: "600", color: colors.ink },
  introVideo: { width: "100%", aspectRatio: 16 / 9, borderRadius: radii.sm, backgroundColor: colors.night },
});
