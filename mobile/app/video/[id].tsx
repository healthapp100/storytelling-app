import { useVideoPlayer, VideoView } from "expo-video";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Pressy } from "../../components/Pressy";
import { getVideo, videoPlaybackUrl } from "../../lib/queries";
import { useToast } from "../../lib/toast";
import { colors, fonts, radii, spacing } from "../../lib/theme";
import type { Video } from "../../types/database";

export default function VideoPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null | "denied">(null);
  const { showToast } = useToast();

  useEffect(() => {
    getVideo(id)
      .then((v) => setVideo(v ?? "denied"))
      // RLS rejects the row for an unauthorized viewer — surface the same
      // "not available" state rather than distinguishing the error reason.
      .catch(() => setVideo("denied"));
  }, [id]);

  const player = useVideoPlayer(
    video && video !== "denied" ? videoPlaybackUrl(video) : "",
    (p) => {
      p.play();
    }
  );

  useEffect(() => {
    const subscription = player.addListener("playToEnd", () => {
      showToast("Story complete — well told!", "celebrate");
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  if (video === null) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Loading…" }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (video === "denied") {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Not available" }} />
        <Text style={styles.deniedTitle}>Not available right now</Text>
        <Text style={styles.deniedText}>
          This video may have expired, or it needs a subscription to watch.
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
