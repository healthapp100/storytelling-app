import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Pressy } from "../Pressy";
import { AppTextInput } from "../AppTextInput";
import { createVideo } from "../../lib/adminActions";
import { uploadLocalFileToStorage } from "../../lib/storageUpload";
import { colors, radii, shadow, spacing } from "../../lib/theme";

export function AdminVideoUploadForm({ sectionId, onUploaded }: { sectionId: string; onUploaded: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [accessTier, setAccessTier] = useState<"subscription" | "one_time">("subscription");
  const [priceCents, setPriceCents] = useState("");
  const [expiresAt, setExpiresAt] = useState(""); // YYYY-MM-DD HH:mm, kept simple for mobile input
  const [isDailyFeatured, setIsDailyFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "video/*" });
    if (!result.canceled && result.assets?.[0]) setFile(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !file || !expiresAt.trim()) {
      Alert.alert("Missing fields", "Title, a video file, and an expiry date are all required.");
      return;
    }
    const expiryDate = new Date(expiresAt.trim());
    if (Number.isNaN(expiryDate.getTime())) {
      Alert.alert("Invalid expiry date", "Use the format YYYY-MM-DD HH:mm, e.g. 2026-08-25 18:00");
      return;
    }
    const price = accessTier === "one_time" ? Number(priceCents) : null;
    if (accessTier === "one_time" && (!price || price <= 0)) {
      Alert.alert("Missing price", "Pay-per-video content needs a price greater than zero.");
      return;
    }

    setUploading(true);
    try {
      setProgressLabel("Uploading video…");
      const { storageKey } = await uploadLocalFileToStorage(
        file.uri,
        file.name ?? "video.mp4",
        file.mimeType ?? "video/mp4"
      );

      setProgressLabel("Saving details…");
      await createVideo({
        sectionId,
        title: title.trim(),
        description: description.trim() || null,
        storageKey,
        durationSeconds: null,
        expiresAt: expiryDate.toISOString(),
        isDailyFeatured,
        accessTier,
        priceCents: price,
      });

      setTitle("");
      setDescription("");
      setFile(null);
      setPriceCents("");
      setExpiresAt("");
      setIsDailyFeatured(false);
      onUploaded();
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setUploading(false);
      setProgressLabel("");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Upload a video</Text>
      <AppTextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <AppTextInput
        style={styles.input}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
      />

      <Pressable style={styles.filePicker} onPress={pickFile}>
        <Text style={styles.filePickerLabel}>{file ? file.name : "Choose a video file"}</Text>
      </Pressable>

      <View style={styles.row}>
        <Pressable style={styles.radioRow} onPress={() => setAccessTier("subscription")}>
          <View style={[styles.radioDot, accessTier === "subscription" && styles.radioDotActive]} />
          <Text style={styles.radioLabel}>Subscription</Text>
        </Pressable>
        <Pressable style={styles.radioRow} onPress={() => setAccessTier("one_time")}>
          <View style={[styles.radioDot, accessTier === "one_time" && styles.radioDotActive]} />
          <Text style={styles.radioLabel}>Pay per video</Text>
        </Pressable>
      </View>
      {accessTier === "one_time" && (
        <AppTextInput
          style={styles.input}
          placeholder="Price in paise (100 = ₹1)"
          value={priceCents}
          onChangeText={setPriceCents}
          keyboardType="number-pad"
        />
      )}

      <Text style={styles.label}>Expiry date (mandatory — video is auto-deleted after this)</Text>
      <AppTextInput
        style={styles.input}
        placeholder="YYYY-MM-DD HH:mm, e.g. 2026-08-25 18:00"
        value={expiresAt}
        onChangeText={setExpiresAt}
      />

      <Pressable style={styles.checkboxRow} onPress={() => setIsDailyFeatured((v) => !v)}>
        <View style={[styles.checkbox, isDailyFeatured && styles.checkboxActive]} />
        <Text style={styles.radioLabel}>Feature as Today&apos;s Video</Text>
      </Pressable>

      {uploading && <Text style={styles.progress}>{progressLabel}</Text>}

      <Pressy style={styles.submitButton} onPress={handleSubmit} disabled={uploading}>
        <Text style={styles.submitLabel}>{uploading ? "Uploading…" : "Upload video"}</Text>
      </Pressy>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  heading: { fontSize: 16, fontWeight: "700", color: colors.ink },
  label: { fontSize: 13, color: colors.inkMuted, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  filePicker: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.sm,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.accentSoft,
  },
  filePickerLabel: { color: colors.accentInk, fontWeight: "600", fontSize: 14 },
  row: { flexDirection: "row", gap: spacing.lg },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  radioDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border },
  radioDotActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  radioLabel: { fontSize: 14, color: colors.ink },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: colors.border },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  progress: { fontSize: 13, color: colors.inkMuted },
  submitButton: { backgroundColor: colors.night, borderRadius: radii.sm, paddingVertical: 12, alignItems: "center" },
  submitLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
