import { useVideoPlayer, VideoView } from "expo-video";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getVideo, videoPlaybackUrl } from "../../lib/queries";
import type { Video } from "../../types/database";

export default function VideoPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null | "denied">(null);

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

  if (video === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (video === "denied") {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedText}>
          This video isn&apos;t available — it may have expired, or it needs a subscription.
        </Text>
        <Pressable style={styles.subscribeButton} onPress={() => router.push("/subscribe")}>
          <Text style={styles.subscribeLabel}>See subscription plans</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <VideoView style={styles.player} player={player} contentFit="contain" nativeControls />
      <View style={styles.details}>
        <Text style={styles.title}>{video.title}</Text>
        {video.description ? <Text style={styles.description}>{video.description}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  deniedText: { textAlign: "center", color: "#666", fontSize: 15 },
  subscribeButton: { backgroundColor: "#111", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  subscribeLabel: { color: "#fff", fontWeight: "700" },
  player: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  details: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  description: { fontSize: 15, color: "#444", lineHeight: 21 },
});
