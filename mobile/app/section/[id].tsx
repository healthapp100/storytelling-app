import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { getVideosForSection } from "../../lib/queries";
import type { Video } from "../../types/database";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

export default function SectionDetail() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [videos, setVideos] = useState<Video[] | null>(null);

  useEffect(() => {
    getVideosForSection(id).then(setVideos);
  }, [id]);

  if (!videos) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.heading}>{title ?? "Section"}</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push({ pathname: "/video/[id]", params: { id: item.id } })}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>
                {formatDuration(item.duration_seconds)}
                {item.access_tier === "one_time" ? " · Pay per video" : ""}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 10 },
  heading: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  row: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 12,
    padding: 14,
  },
  rowText: { gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowMeta: { fontSize: 13, color: "#888" },
});
