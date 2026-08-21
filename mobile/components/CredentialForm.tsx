import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { Credential } from "../lib/auth";

type Method = "email" | "phone";

type Props = {
  submitLabel: string;
  showNameField?: boolean;
  onSubmit: (credential: Credential, displayName: string) => Promise<void>;
};

export function CredentialForm({ submitLabel, showNameField, onSubmit }: Props) {
  const [method, setMethod] = useState<Method>("email");
  const [displayName, setDisplayName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const credential: Credential =
        method === "email"
          ? { kind: "email", email: identifier, password }
          : { kind: "phone", phone: identifier, password };
      await onSubmit(credential, displayName);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.methodSwitch}>
        <Pressable
          style={[styles.methodButton, method === "email" && styles.methodButtonActive]}
          onPress={() => setMethod("email")}
        >
          <Text style={[styles.methodLabel, method === "email" && styles.methodLabelActive]}>
            Email
          </Text>
        </Pressable>
        <Pressable
          style={[styles.methodButton, method === "phone" && styles.methodButtonActive]}
          onPress={() => setMethod("phone")}
        >
          <Text style={[styles.methodLabel, method === "phone" && styles.methodLabelActive]}>
            Phone
          </Text>
        </Pressable>
      </View>

      {showNameField && (
        <TextInput
          style={styles.input}
          placeholder="Your name"
          value={displayName}
          onChangeText={setDisplayName}
          autoComplete="name"
          textContentType="name"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder={method === "email" ? "Email" : "Phone number (with country code)"}
        value={identifier}
        onChangeText={setIdentifier}
        keyboardType={method === "email" ? "email-address" : "phone-pad"}
        autoCapitalize="none"
        autoComplete="username"
        textContentType="username"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
      />

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <Pressable
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitLabel}>{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  methodSwitch: {
    flexDirection: "row",
    backgroundColor: "#EEE",
    borderRadius: 10,
    padding: 4,
  },
  methodButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  methodButtonActive: { backgroundColor: "#fff" },
  methodLabel: { color: "#666", fontWeight: "600" },
  methodLabelActive: { color: "#111" },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { color: "#C33", fontSize: 14 },
  submitButton: {
    backgroundColor: "#111",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitLabel: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
