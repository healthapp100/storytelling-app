import { useVideoPlayer, VideoView } from "expo-video";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Pressy } from "../../components/Pressy";
import { getVideo, getVideoCatalogEntry, videoPlaybackUrl } from "../../lib/queries";
import { purchaseVideo } from "../../lib/purchases";
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
  const [purchasing, setPurchasing] = useState(false);
  const { showToast } = useToast();
  const resumedRef = useRef(false);

  const load = () => {
    setVideo(null);
    getVideo(id)
      .then((v) => setVideo(v ?? "denied"))
      // RLS rejects the row for an unauthorized viewer.
      .catch(() => setVideo("denied"));
  };

  useEffect(load, [id]);

  const handleBuy = async () => {
    if (deniedInfo === "unknown" || !deniedInfo) return;
    setPurchasing(true);
    try {
      await purchaseVideo(deniedInfo);
      showToast("Unlocked! Enjoy the story.", "celebrate");
      load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Purchase failed — try again.", "error");
    } finally {
      setPurchasing(false);
    }
  };

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
          <Stack.Screen options={{ title: "" }} />
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }

    const paid = deniedInfo?.access_tier === "one_time";
    return (
      <View style={styles.locked}>
        <Stack.Screen options={{ title: "" }} />
        <Text style={styles.lockedTitle}>{deniedInfo ? deniedInfo.title : "This story isn't available right now."}</Text>
        <View style={styles.lockedRule} />
        <Text style={styles.lockedText}>
          {deniedInfo
            ? paid
              ? `This story is ₹${deniedInfo.price_rupees ?? 0} — a one-time purchase that stays yours for as long as it remains in the library.`
              : "It's part of the subscription. Subscribe once and every story opens."
            : "It may have been taken down, or it needs a subscription to watch."}
        </Text>
        <Pressy
          style={styles.lockedButton}
          disabled={purchasing}
          onPress={paid ? handleBuy : () => router.push("/subscribe")}
        >
          {purchasing ? (
            <ActivityIndicator color={colors.cream} />
          ) : (
            <Text style={styles.lockedButtonLabel}>
              {paid ? `Buy for ₹${deniedInfo?.price_rupees ?? 0}` : "See the plans"}
            </Text>
          )}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  locked: { flex: 1, padding: spacing.lg, paddingTop: spacing.xl, backgroundColor: colors.paper },
  lockedTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.ink },
  lockedRule: { width: 40, height: 3, backgroundColor: colors.accent, marginVertical: spacing.lg },
  lockedText: { fontSize: 16, lineHeight: 25, color: colors.inkMuted, marginBottom: spacing.xl },
  lockedButton: {
    backgroundColor: colors.night,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  lockedButtonLabel: { color: colors.cream, fontFamily: fonts.displayMedium, fontSize: 19 },
  player: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  details: { padding: spacing.lg, gap: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.ink },
  description: { fontSize: 16, color: colors.inkMuted, lineHeight: 25 },
});
