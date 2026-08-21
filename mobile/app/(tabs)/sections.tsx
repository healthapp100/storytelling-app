import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text } from "react-native";
import { getSections } from "../../lib/queries";
import type { Section } from "../../types/database";

export default function Sections() {
  const [sections, setSections] = useState<Section[] | null>(null);

  useEffect(() => {
    getSections().then(setSections);
  }, []);

  if (!sections) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push({ pathname: "/section/[id]", params: { id: item.id, title: item.title } })}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  cardDescription: { fontSize: 14, color: "#666" },
});
