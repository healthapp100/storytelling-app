import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Pressy } from "../../components/Pressy";
import { getSections } from "../../lib/queries";
import { useRealtimeTable } from "../../lib/realtime";
import { colors, fonts, radii, shadow, spacing } from "../../lib/theme";
import type { Section } from "../../types/database";

export default function Sections() {
  const [sections, setSections] = useState<Section[] | null>(null);

  const load = useCallback(() => {
    getSections().then(setSections);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable("sections", load);

  if (!sections) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Explore</Text>
            <Text style={styles.heading}>Sections</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressy
            style={styles.card}
            onPress={() => router.push({ pathname: "/section/[id]", params: { id: item.id, title: item.title } })}
          >
            <Text style={styles.cardIndex}>{String(index + 1).padStart(2, "0")}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </Pressy>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.sm },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heading: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.paperRaised,
    borderRadius: radii.md,
    padding: spacing.lg,
    ...shadow.card,
  },
  cardIndex: { fontFamily: fonts.display, fontSize: 20, color: colors.accent, opacity: 0.5 },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  cardDescription: { fontSize: 14, color: colors.inkMuted },
  cardArrow: { color: colors.accent, fontSize: 18, fontWeight: "700" },
});
