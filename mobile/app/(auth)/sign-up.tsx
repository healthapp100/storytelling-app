import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CredentialForm } from "../../components/CredentialForm";
import { FadeIn } from "../../components/FadeIn";
import { signUp } from "../../lib/auth";
import { colors, fonts, spacing } from "../../lib/theme";

const LEGAL_URL = process.env.EXPO_PUBLIC_LEGAL_URL;

export default function SignUp() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <FadeIn>
            <Text style={styles.wordmark}>Storytelling</Text>
            <Text style={styles.title}>Begin here.</Text>
            <Text style={styles.subtitle}>
              Use your email or phone number, whichever is easier. You&apos;ll stay signed in until you sign out.
            </Text>
          </FadeIn>

          <FadeIn delay={120}>
          <CredentialForm
            submitLabel="Create account"
            showNameField
            onSubmit={async (credential, displayName) => {
              await signUp(credential, displayName);
              router.replace("/(tabs)");
            }}
          />

          {LEGAL_URL && (
            <Text style={styles.legalText}>
              By creating an account, you agree to our{" "}
              <Text style={styles.legalLink} onPress={() => Linking.openURL(`${LEGAL_URL}/terms`)}>
                Terms
              </Text>{" "}
              and{" "}
              <Text style={styles.legalLink} onPress={() => Linking.openURL(`${LEGAL_URL}/privacy`)}>
                Privacy Policy
              </Text>
              .
            </Text>
          )}

          <Link href="/(auth)/sign-in" style={styles.link}>
            <Text style={styles.linkText}>Already registered? Sign in</Text>
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
  link: { marginTop: spacing.lg, alignSelf: "flex-start" },
  linkText: { color: colors.ink, fontSize: 15.5, fontWeight: "600", textDecorationLine: "underline" },
  legalText: { marginTop: spacing.lg, fontSize: 13, color: colors.inkMuted, lineHeight: 19 },
  legalLink: { color: colors.ink, fontWeight: "700", textDecorationLine: "underline" },
});
