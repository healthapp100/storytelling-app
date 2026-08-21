import { useVideoPlayer, VideoView } from "expo-video";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Pressy } from "../../components/Pressy";
import { getAppContent, getTodaysVideo } from "../../lib/queries";
import { useRealtimeTable } from "../../lib/realtime";
import { colors, fonts, radii, shadow, spacing } from "../../lib/theme";
import type { Video } from "../../types/database";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [introText, setIntroText] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);
  const [todaysVideo, setTodaysVideo] = useState<Video | null>(null);

  const load = useCallback(async () => {
    const [about, introKey, today] = await Promise.all([
      getAppContent("home_intro_text"),
      getAppContent("home_intro_video_key"),
      getTodaysVideo(),
    ]);
    setIntroText((about?.value as string) ?? "");
    const publicBase = process.env.EXPO_PUBLIC_R2_PUBLIC_BASE_URL;
    setIntroVideoUrl(introKey?.value && publicBase ? `${publicBase}/${introKey.value as string}` : null);
    setTodaysVideo(today);
    setLoading(false);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          <Text style={styles.eyebrow}>Every day, a new story</Text>
          <Text style={styles.heading}>Storytelling</Text>
        </View>
        {introText ? <Text style={styles.intro}>{introText}</Text> : null}

        {todaysVideo && (
          <Pressy
            style={styles.todayCard}
            onPress={() => router.push({ pathname: "/video/[id]", params: { id: todaysVideo.id } })}
          >
            <Text style={styles.todayLabel}>Today&apos;s story</Text>
            <Text style={styles.todayTitle}>{todaysVideo.title}</Text>
            <View style={styles.todayCtaRow}>
              <Text style={styles.todayCta}>Watch now</Text>
              <Text style={styles.todayCtaArrow}>→</Text>
            </View>
          </Pressy>
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
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.card,
  },
  todayLabel: { color: "#D8B79A", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: "700" },
  todayTitle: { color: "#fff", fontFamily: fonts.display, fontSize: 22, marginTop: 2 },
  todayCtaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md },
  todayCta: { color: "#fff", fontWeight: "700", fontSize: 15 },
  todayCtaArrow: { color: colors.accent, fontWeight: "700", fontSize: 16 },
  introVideoWrap: { gap: spacing.sm },
  sectionLabel: { fontSize: 13, color: colors.inkMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  introVideo: { width: "100%", aspectRatio: 16 / 9, borderRadius: radii.md, backgroundColor: colors.ink },
});
