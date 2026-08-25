import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ErrorState } from "../../components/ErrorState";
import { Pressy } from "../../components/Pressy";
import { getSections } from "../../lib/queries";
import { useRealtimeTable } from "../../lib/realtime";
import { iconForSection } from "../../lib/sectionIcon";
import { colors, fonts, radii, shadow, spacing } from "../../lib/theme";
import type { Section } from "../../types/database";

export default function Sections() {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    return getSections()
      .then(setSections)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useRealtimeTable("sections", load);

  if (failed) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ErrorState onRetry={load} />
      </SafeAreaView>
    );
  }

  if (!sections) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Explore</Text>
            <Text style={styles.heading}>Sections</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="leaf-outline" size={22} color={colors.inkFaint} />
            <Text style={styles.emptyText}>No sections yet — the admin hasn't added any.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressy
            style={styles.card}
            onPress={() => router.push({ pathname: "/section/[id]", params: { id: item.id, title: item.title } })}
          >
            <View style={styles.cardIconWrap}>
              {item.icon_url ? (
                <Image source={{ uri: item.icon_url }} style={styles.cardIconImage} />
              ) : (
                <Ionicons name={iconForSection(item.slug)} size={20} color={colors.accentInk} />
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
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
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardIconImage: { width: 44, height: 44 },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  cardDescription: { fontSize: 14, color: colors.inkMuted },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyText: { color: colors.inkFaint, fontSize: 14, textAlign: "center" },
});
