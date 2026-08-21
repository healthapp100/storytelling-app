import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { Pressy } from "./Pressy";
import { TextButton } from "./TextButton";
import type { Credential } from "../lib/auth";
import { colors, radii, spacing } from "../lib/theme";

type Method = "email" | "phone";

type Props = {
  submitLabel: string;
  showNameField?: boolean;
  onSubmit: (credential: Credential, displayName: string) => Promise<void>;
};

// Explicit text/placeholder colors below aren't cosmetic — without them,
// some Android OEM skins render TextInput's default text color as very
// light grey/white regardless of the app's theme, making typed text and
// placeholders unreadable on this screen's white background.
const TEXT_COLOR = colors.ink;
const PLACEHOLDER_COLOR = colors.inkFaint;

export function CredentialForm({ submitLabel, showNameField, onSubmit }: Props) {
  const [method, setMethod] = useState<Method>("email");
  const [displayName, setDisplayName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const credential: Credential =
        method === "email"
          ? { kind: "email", email: identifier.trim(), password }
          : { kind: "phone", phone: identifier.trim(), password };
      await onSubmit(credential, displayName.trim());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.methodSwitch}>
        <Pressy
          style={[styles.methodButton, method === "email" && styles.methodButtonActive]}
          onPress={() => setMethod("email")}
          scaleTo={0.98}
        >
          <Ionicons
            name="mail-outline"
            size={15}
            color={method === "email" ? colors.accentInk : colors.accentInk}
            style={{ opacity: method === "email" ? 1 : 0.6 }}
          />
          <Text style={[styles.methodLabel, method === "email" && styles.methodLabelActive]}>
            Email
          </Text>
        </Pressy>
        <Pressy
          style={[styles.methodButton, method === "phone" && styles.methodButtonActive]}
          onPress={() => setMethod("phone")}
          scaleTo={0.98}
        >
          <Ionicons
            name="call-outline"
            size={15}
            color={colors.accentInk}
            style={{ opacity: method === "phone" ? 1 : 0.6 }}
          />
          <Text style={[styles.methodLabel, method === "phone" && styles.methodLabelActive]}>
            Phone
          </Text>
        </Pressy>
      </View>

      {showNameField && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
            textContentType="name"
          />
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{method === "email" ? "Email" : "Phone number"}</Text>
        <TextInput
          style={styles.input}
          placeholder={method === "email" ? "you@example.com" : "e.g. +1 555 123 4567"}
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType={method === "email" ? "email-address" : "phone-pad"}
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="At least 6 characters"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            autoComplete="password"
            textContentType="password"
          />
          <TextButton
            style={styles.passwordToggleLabel}
            onPress={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? "Hide" : "Show"}
          </TextButton>
        </View>
      </View>

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.error}>{errorMessage}</Text>
        </View>
      )}

      <Pressy
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitLabel}>{submitLabel}</Text>
        )}
      </Pressy>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md + 4 },
  methodSwitch: {
    flexDirection: "row",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md - 3,
    alignItems: "center",
    justifyContent: "center",
  },
  methodButtonActive: {
    backgroundColor: colors.paperRaised,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  methodLabel: { color: colors.accentInk, fontWeight: "600", fontSize: 14, opacity: 0.6 },
  methodLabelActive: { color: colors.accentInk, opacity: 1 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.inkMuted },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: TEXT_COLOR,
    backgroundColor: colors.paperRaised,
  },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  passwordInput: { flex: 1 },
  passwordToggleLabel: {
    color: colors.inkMuted,
    fontWeight: "600",
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.sm + 2,
    padding: 10,
  },
  error: { color: colors.danger, fontSize: 14 },
  submitButton: {
    backgroundColor: colors.night,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitLabel: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
