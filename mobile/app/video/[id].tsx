import { useVideoPlayer, VideoView } from "expo-video";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Pressy } from "../../components/Pressy";
import { getVideo, getVideoCatalogEntry, videoPlaybackUrl } from "../../lib/queries";
import { useToast } from "../../lib/toast";
import { clearWatchProgress, getWatchProgress, saveWatchProgress } from "../../lib/watchProgress";
import { colors, fonts, radii, spacing } from "../../lib/theme";
import type { Video, VideoCatalogEntry } from "../../types/database";

// Don't bother resuming into the last few seconds — that's effectively
// "finished" and resuming there just replays the ending.
const RESUME_TAIL_SECONDS = 15;

export default function VideoPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null | "denied">(null);
  // Only fetched when access is denied — tells the denial screen *why*
  // (subscription-only vs. pay-per-video with no purchase flow yet) instead
  // of one generic "not available" message for every case.
  const [deniedInfo, setDeniedInfo] = useState<VideoCatalogEntry | null | "unknown">("unknown");
  const { showToast } = useToast();
  const resumedRef = useRef(false);

  useEffect(() => {
    getVideo(id)
      .then((v) => setVideo(v ?? "denied"))
      // RLS rejects the row for an unauthorized viewer.
      .catch(() => setVideo("denied"));
  }, [id]);

  useEffect(() => {
    if (video !== "denied") return;
    getVideoCatalogEntry(id)
      .then(setDeniedInfo)
      .catch(() => setDeniedInfo(null));
  }, [video, id]);

  const player = useVideoPlayer(
    video && video !== "denied" ? videoPlaybackUrl(video) : "",
    (p) => {
      p.timeUpdateEventInterval = 5;
      p.play();
    }
  );

  useEffect(() => {
    const endSub = player.addListener("playToEnd", () => {
      showToast("Story complete — well told!", "celebrate");
      if (video && video !== "denied") clearWatchProgress(video.id);
    });

    // Resumes once, the first time this video's duration is known — seeking
    // any earlier just gets overwritten as soon as the real duration loads.
    const loadSub = player.addListener("sourceLoad", async (payload) => {
      if (resumedRef.current || !video || video === "denied") return;
      resumedRef.current = true;
      const saved = await getWatchProgress(video.id);
      if (saved && saved.position < payload.duration - RESUME_TAIL_SECONDS) {
        player.currentTime = saved.position;
      }
    });

    const timeSub = player.addListener("timeUpdate", (payload) => {
      if (!video || video === "denied" || !player.duration) return;
      saveWatchProgress(video.id, payload.currentTime, player.duration);
    });

    return () => {
      endSub.remove();
      loadSub.remove();
      timeSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, video]);

  if (video === null) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Loading…" }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (video === "denied") {
    if (deniedInfo === "unknown") {
      return (
        <View style={styles.center}>
          <Stack.Screen options={{ title: "Loading…" }} />
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }

    if (deniedInfo?.access_tier === "one_time") {
      return (
        <View style={styles.center}>
          <Stack.Screen options={{ title: "Not available" }} />
          <Text style={styles.deniedTitle}>{deniedInfo.title}</Text>
          <Text style={styles.deniedText}>
            This story costs ₹{deniedInfo.price_rupees ?? 0} to unlock. Pay-per-video purchases
            aren&apos;t available in the app yet — we&apos;re working on it, check back soon.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Not available" }} />
        <Text style={styles.deniedTitle}>{deniedInfo ? deniedInfo.title : "Not available right now"}</Text>
        <Text style={styles.deniedText}>
          {deniedInfo
            ? "Subscribe to unlock this and every story."
            : "This video may have expired, or it needs a subscription to watch."}
        </Text>
        <Pressy style={styles.subscribeButton} onPress={() => router.push("/subscribe")}>
          <Text style={styles.subscribeLabel}>See subscription plans</Text>
        </Pressy>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: video.title }} />
      <VideoView style={styles.player} player={player} contentFit="contain" nativeControls />
      <View style={styles.details}>
        <Text style={styles.title}>{video.title}</Text>
        {video.description ? <Text style={styles.description}>{video.description}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.paper,
  },
  deniedTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, textAlign: "center" },
  deniedText: { textAlign: "center", color: colors.inkMuted, fontSize: 15, lineHeight: 21, marginBottom: spacing.sm },
  subscribeButton: {
    backgroundColor: colors.night,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 22,
  },
  subscribeLabel: { color: "#fff", fontWeight: "700" },
  player: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  details: { padding: spacing.lg, gap: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  description: { fontSize: 15, color: colors.inkMuted, lineHeight: 22 },
});
