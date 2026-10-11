import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing } from "../lib/theme";

// Every top-level screen opens the same way: a large serif title and a
// ruled line with a short vermilion stroke at its left end, like a heading
// inked above a column of text.
export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.rule}>
        <View style={styles.mark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 36, lineHeight: 42, color: colors.ink },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.inkMuted, marginTop: 4 },
  rule: { height: 1, backgroundColor: colors.rule, marginTop: spacing.md },
  mark: { width: 40, height: 3, backgroundColor: colors.accent, marginTop: -1 },
});
