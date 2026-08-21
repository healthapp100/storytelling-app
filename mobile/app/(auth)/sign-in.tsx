import { Link, router } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { CredentialForm } from "../../components/CredentialForm";
import { signIn } from "../../lib/auth";

export default function SignIn() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in with your email or phone number.</Text>

        <CredentialForm
          submitLabel="Sign in"
          onSubmit={async (credential) => {
            await signIn(credential);
            router.replace("/(tabs)");
          }}
        />

        <Link href="/(auth)/sign-up" style={styles.link}>
          <Text>Don&apos;t have an account? Create one</Text>
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
