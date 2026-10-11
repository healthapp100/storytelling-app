import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { CredentialForm } from "../../components/CredentialForm";
import { FadeIn } from "../../components/FadeIn";
import { signIn } from "../../lib/auth";
import { colors, fonts, spacing } from "../../lib/theme";

export default function SignIn() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <FadeIn>
            <Text style={styles.wordmark}>Storytelling</Text>
            <Text style={styles.title}>Welcome back.</Text>
            <Text style={styles.subtitle}>Sign in with the email or phone number you registered with.</Text>
          </FadeIn>

          <FadeIn delay={120}>
            <CredentialForm
              submitLabel="Sign in"
              onSubmit={async (credential) => {
                await signIn(credential);
                router.replace("/(tabs)");
              }}
            />

            <Link href="/(auth)/sign-up" style={styles.link}>
              <Text style={styles.linkText}>New here? Create an account</Text>
            </Link>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xxl, gap: spacing.xl },
  wordmark: { fontFamily: fonts.displayMedium, fontSize: 18, color: colors.accent, marginBottom: spacing.xl },
  title: { fontFamily: fonts.display, fontSize: 44, lineHeight: 50, color: colors.ink },
  subtitle: { fontSize: 16, color: colors.inkMuted, marginTop: spacing.sm, lineHeight: 24 },
  link: { marginTop: spacing.xl, alignSelf: "flex-start" },
  linkText: { color: colors.ink, fontSize: 15.5, fontWeight: "600", textDecorationLine: "underline" },
});
