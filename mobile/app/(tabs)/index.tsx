import { useVideoPlayer, VideoView } from "expo-video";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getAppContent, getTodaysVideo, videoPlaybackUrl } from "../../lib/queries";
import type { Video } from "../../types/database";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [introText, setIntroText] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);
  const [todaysVideo, setTodaysVideo] = useState<Video | null>(null);

  useEffect(() => {
    (async () => {
      const [about, introKey, today] = await Promise.all([
        getAppContent("home_intro_text"),
        getAppContent("home_intro_video_key"),
        getTodaysVideo(),
      ]);
      setIntroText((about?.value as string) ?? "");
      const publicBase = process.env.EXPO_PUBLIC_R2_PUBLIC_BASE_URL;
      if (introKey?.value && publicBase) {
        setIntroVideoUrl(`${publicBase}/${introKey.value as string}`);
      }
      setTodaysVideo(today);
      setLoading(false);
    })();
  }, []);

  const introPlayer = useVideoPlayer(introVideoUrl ?? "", (player) => {
    player.loop = true;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Storytelling App</Text>
        {introText ? <Text style={styles.intro}>{introText}</Text> : null}

        {todaysVideo && (
          <Pressable
            style={styles.todayCard}
            onPress={() => router.push({ pathname: "/video/[id]", params: { id: todaysVideo.id } })}
          >
            <Text style={styles.todayLabel}>Today&apos;s video</Text>
            <Text style={styles.todayTitle}>{todaysVideo.title}</Text>
            <Text style={styles.todayCta}>Watch now →</Text>
          </Pressable>
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
  safeArea: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 20, gap: 20 },
  heading: { fontSize: 26, fontWeight: "800" },
  intro: { fontSize: 15, color: "#444", lineHeight: 21 },
  todayCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  todayLabel: { color: "#AAA", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  todayTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  todayCta: { color: "#fff", marginTop: 8, fontWeight: "600" },
  introVideoWrap: { gap: 8 },
  sectionLabel: { fontSize: 13, color: "#666", fontWeight: "600" },
  introVideo: { width: "100%", aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: "#000" },
});
