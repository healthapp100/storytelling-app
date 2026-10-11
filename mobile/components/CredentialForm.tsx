import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { Pressy } from "./Pressy";
import type { Credential } from "../lib/auth";
import { colors, fonts, radii, spacing } from "../lib/theme";

type Method = "email" | "phone";

type Props = {
  submitLabel: string;
  showNameField?: boolean;
  onSubmit: (credential: Credential, displayName: string) => Promise<void>;
};

// Explicit text/placeholder colors aren't cosmetic — some Android OEM skins
// render TextInput's default text color as very light grey regardless of the
// app's theme, making typed text and placeholders unreadable.
function Field({ label, trailing, ...input }: TextInputProps & { label: string; trailing?: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <TextInput
          {...input}
          style={styles.input}
          placeholderTextColor={colors.inkFaint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {trailing}
      </View>
    </View>
  );
}

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
      <View style={styles.methods}>
        {(["email", "phone"] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: method === option }}
            onPress={() => setMethod(option)}
            style={[styles.method, method === option && styles.methodActive]}
          >
            <Text style={[styles.methodLabel, method === option && styles.methodLabelActive]}>
              {option === "email" ? "Email" : "Phone"}
            </Text>
          </Pressable>
        ))}
      </View>

      {showNameField && (
        <Field
          label="Your name"
          placeholder="As you'd like us to greet you"
          value={displayName}
          onChangeText={setDisplayName}
          autoComplete="name"
          textContentType="name"
        />
      )}

      <Field
        label={method === "email" ? "Email address" : "Phone number"}
        placeholder={method === "email" ? "you@example.com" : "+91 98765 43210"}
        value={identifier}
        onChangeText={setIdentifier}
        keyboardType={method === "email" ? "email-address" : "phone-pad"}
        autoCapitalize="none"
        autoComplete="username"
        textContentType="username"
      />

      <Field
        label="Password"
        placeholder="At least 6 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!passwordVisible}
        autoComplete="password"
        textContentType="password"
        trailing={
          <Pressable onPress={() => setPasswordVisible((visible) => !visible)} hitSlop={10}>
            <Text style={styles.toggle}>{passwordVisible ? "Hide" : "Show"}</Text>
          </Pressable>
        }
      />

      {errorMessage && (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <Pressy
        style={[styles.submit, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.submitLabel}>{submitLabel}</Text>}
      </Pressy>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  methods: { flexDirection: "row", gap: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  method: { paddingBottom: 10, marginBottom: -1, borderBottomWidth: 3, borderBottomColor: "transparent" },
  methodActive: { borderBottomColor: colors.accent },
  methodLabel: { fontFamily: fonts.displayMedium, fontSize: 18, color: colors.inkFaint },
  methodLabelActive: { color: colors.ink },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13.5, color: colors.inkMuted },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: colors.rule,
  },
  inputRowFocused: { borderBottomColor: colors.ink },
  input: { flex: 1, fontSize: 17, paddingVertical: 11, color: colors.ink },
  toggle: { fontSize: 14, fontWeight: "600", color: colors.accent, paddingLeft: spacing.sm },
  error: { borderLeftWidth: 3, borderLeftColor: colors.danger, paddingLeft: spacing.md, paddingVertical: 2 },
  errorText: { color: colors.danger, fontSize: 14.5, lineHeight: 20 },
  submit: {
    backgroundColor: colors.night,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitDisabled: { opacity: 0.6 },
  submitLabel: { color: colors.cream, fontFamily: fonts.displayMedium, fontSize: 20 },
});
