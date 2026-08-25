import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Pressy } from "./Pressy";
import { colors, fonts, radii, spacing } from "../lib/theme";

// Shown whenever a screen's data fetch actually fails (network blip, a
// backend hiccup, anything) instead of leaving the screen on an infinite
// spinner with no way out and no explanation — the failure mode every
// screen had before this existed. "Coming soon" framing on purpose: it
// reads as "this isn't ready yet," not "you did something wrong."
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="construct-outline" size={26} color={colors.accent} />
      </View>
      <Text style={styles.title}>Working on it</Text>
      <Text style={styles.message}>
        This isn&apos;t loading right now — it might just be a slow connection. Give it another try.
      </Text>
      <Pressy style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonLabel}>Try again</Text>
      </Pressy>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  message: { textAlign: "center", color: colors.inkMuted, fontSize: 14.5, lineHeight: 21 },
  button: {
    backgroundColor: colors.night,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 22,
    marginTop: spacing.sm,
  },
  buttonLabel: { color: "#fff", fontWeight: "700" },
});
