import { StyleSheet, Text, View } from "react-native";
import { Pressy } from "./Pressy";
import { colors, fonts, radii, spacing } from "../lib/theme";

// Shown whenever a screen's data fetch actually fails, instead of leaving it
// on an endless spinner with no way out. Worded as "not ready yet" rather
// than "you did something wrong".
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This page isn&apos;t loading right now.</Text>
      <View style={styles.rule} />
      <Text style={styles.message}>
        It&apos;s most likely a slow or dropped connection. Nothing you did caused it — give it another go.
      </Text>
      <Pressy style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonLabel}>Try again</Text>
      </Pressy>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.ink },
  rule: { width: 40, height: 3, backgroundColor: colors.accent, marginVertical: spacing.lg },
  message: { color: colors.inkMuted, fontSize: 16, lineHeight: 24, marginBottom: spacing.xl },
  button: { backgroundColor: colors.night, borderRadius: radii.md, paddingVertical: 15, alignItems: "center" },
  buttonLabel: { color: colors.cream, fontFamily: fonts.displayMedium, fontSize: 19 },
});
