import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ErrorState } from "../../components/ErrorState";
import { Pressy } from "../../components/Pressy";
import { getAppContent, getTodaysVideo, storagePublicUrl } from "../../lib/queries";
import { useRealtimeTable } from "../../lib/realtime";
import { colors, fonts, radii, shadow, spacing } from "../../lib/theme";
import type { Video } from "../../types/database";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [introText, setIntroText] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);
  const [todaysVideo, setTodaysVideo] = useState<Video | null>(null);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [about, introKey, today] = await Promise.all([
        getAppContent("home_intro_text"),
        getAppContent("home_intro_video_key"),
        getTodaysVideo(),
      ]);
      setIntroText((about?.value as string) ?? "");
      setIntroVideoUrl(introKey?.value ? storagePublicUrl(introKey.value as string) : null);
      setTodaysVideo(today);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
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
      <ScrollView contentContainerStyle={styles.container}>
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
            style={styles.todayCard}
            onPress={() => router.push({ pathname: "/video/[id]", params: { id: todaysVideo.id } })}
          >
            <View style={styles.todayLabelRow}>
              <Ionicons name="sparkles" size={13} color={colors.accentSoft} />
              <Text style={styles.todayLabel}>Today&apos;s story</Text>
            </View>
            <Text style={styles.todayTitle}>{todaysVideo.title}</Text>
            <View style={styles.todayCtaRow}>
              <Text style={styles.todayCta}>Watch now</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.accent} />
            </View>
          </Pressy>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="moon-outline" size={22} color={colors.inkFaint} />
            <Text style={styles.emptyText}>No story featured yet today — check back soon.</Text>
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
  todayCard: {
    backgroundColor: colors.night,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.card,
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
  introVideoWrap: { gap: spacing.sm },
  sectionLabel: { fontSize: 13, color: colors.inkMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  introVideo: { width: "100%", aspectRatio: 16 / 9, borderRadius: radii.md, backgroundColor: colors.night },
});
