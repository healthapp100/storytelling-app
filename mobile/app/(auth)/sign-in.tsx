import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CredentialForm } from "../../components/CredentialForm";
import { signIn } from "../../lib/auth";
import { colors, fonts, radii, spacing } from "../../lib/theme";

export default function SignIn() {
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
          <View style={styles.brandMark}>
            <Ionicons name="flame" size={22} color={colors.accent} />
          </View>
          <Text style={styles.eyebrow}>Welcome back</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Use the email or phone number you signed up with.</Text>

          <CredentialForm
            submitLabel="Sign in"
            onSubmit={async (credential) => {
              await signIn(credential);
              router.replace("/(tabs)");
            }}
          />

          <Link href="/(auth)/sign-up" style={styles.link}>
            <Text style={styles.linkText}>Don&apos;t have an account? Create one</Text>
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
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
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
