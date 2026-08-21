import { Link, router } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { CredentialForm } from "../../components/CredentialForm";
import { signUp } from "../../lib/auth";

export default function SignUp() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Use your email or phone number — whichever is easier.</Text>

        <CredentialForm
          submitLabel="Create account"
          showNameField
          onSubmit={async (credential, displayName) => {
            await signUp(credential, displayName);
            router.replace("/(tabs)");
          }}
        />

        <Link href="/(auth)/sign-in" style={styles.link}>
          <Text>Already have an account? Sign in</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 8 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 16 },
  link: { marginTop: 20, alignSelf: "center" },
});
