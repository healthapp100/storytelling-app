import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ErrorState } from "../../components/ErrorState";
import { FadeIn } from "../../components/FadeIn";
import { PageHeading } from "../../components/PageHeading";
import { getSections } from "../../lib/queries";
import { useRealtimeTable } from "../../lib/realtime";
import { colors, fonts, radii, spacing } from "../../lib/theme";
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
          <PageHeading
            title="Library"
            subtitle={sections.length > 0 ? `${sections.length} collections of stories` : undefined}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing here yet.</Text>
            <Text style={styles.emptyText}>Collections will be listed here once they&apos;re added.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeIn delay={Math.min(index, 8) * 60}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/section/[id]", params: { id: item.id, title: item.title } })}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={styles.numeral}>{String(index + 1).padStart(2, "0")}</Text>
              <View style={styles.body}>
                <Text style={styles.title}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              {item.icon_url ? <Image source={{ uri: item.icon_url }} style={styles.iconImage} /> : null}
            </Pressable>
          </FadeIn>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  list: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.accentSoft },
  numeral: { width: 44, fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.accent },
  body: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, color: colors.ink },
  description: { fontSize: 14.5, lineHeight: 21, color: colors.inkMuted },
  iconImage: { width: 52, height: 52, borderRadius: radii.sm, backgroundColor: colors.border },
  empty: { paddingVertical: spacing.lg, gap: 4 },
  emptyTitle: { fontFamily: fonts.displayMedium, fontSize: 20, color: colors.ink },
  emptyText: { fontSize: 14.5, lineHeight: 21, color: colors.inkMuted },
});
