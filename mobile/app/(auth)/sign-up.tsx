import { Link, router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { CredentialForm } from "../../components/CredentialForm";
import { signUp } from "../../lib/auth";
import { colors, fonts, spacing } from "../../lib/theme";

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
          <Text style={styles.eyebrow}>Get started</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Use your email or phone number, whichever is easier — you'll stay signed in until you
            sign out.
          </Text>

          <CredentialForm
            submitLabel="Create account"
            showNameField
            onSubmit={async (credential, displayName) => {
              await signUp(credential, displayName);
              router.replace("/(tabs)");
            }}
          />

          <Link href="/(auth)/sign-in" style={styles.link}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.lg, paddingVertical: spacing.xxl },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  subtitle: { fontSize: 15, color: colors.inkMuted, marginTop: 6, marginBottom: spacing.xl, lineHeight: 21 },
  link: { marginTop: spacing.xl, alignSelf: "center" },
  linkText: { color: colors.inkMuted, fontSize: 14, fontWeight: "600" },
});
