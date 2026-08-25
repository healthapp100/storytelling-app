import * as DocumentPicker from "expo-document-picker";
import { createVideoPlayer } from "expo-video";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Pressy } from "../Pressy";
import { AppTextInput } from "../AppTextInput";
import { DateTimeField } from "../DateTimeField";
import { createVideo } from "../../lib/adminActions";
import { uploadLocalFileToStorage } from "../../lib/storageUpload";
import { useToast } from "../../lib/toast";
import { colors, radii, shadow, spacing } from "../../lib/theme";

// Reads the duration straight off the picked file so admins never have to
// type it in by hand. Best-effort: if the player can't probe the file for
// any reason, upload still proceeds with an unknown duration.
function detectDuration(uri: string): Promise<number | null> {
  return new Promise((resolve) => {
    const player = createVideoPlayer(uri);
    let settled = false;
    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      subscription.remove();
      player.release();
      resolve(value);
    };
    const subscription = player.addListener("sourceLoad", (payload) => {
      finish(Number.isFinite(payload.duration) ? Math.round(payload.duration) : null);
    });
    setTimeout(() => finish(null), 8000);
  });
}

export function AdminVideoUploadForm({ sectionId, onUploaded }: { sectionId: string; onUploaded: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [accessTier, setAccessTier] = useState<"subscription" | "one_time">("subscription");
  const [priceRupees, setPriceCents] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isDailyFeatured, setIsDailyFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const { showToast } = useToast();

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "video/*" });
    if (!result.canceled && result.assets?.[0]) setFile(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !file || !expiresAt) {
      showToast("Title, a video file, and an expiry date are all required.", "error");
      return;
    }
    const expiryDate = expiresAt;
    const price = accessTier === "one_time" ? Number(priceRupees) : null;
    if (accessTier === "one_time" && (!price || price <= 0)) {
      showToast("Pay-per-video content needs a price greater than zero.", "error");
      return;
    }

    setUploading(true);
    try {
      setProgressLabel("Reading video details…");
      const durationSeconds = await detectDuration(file.uri);

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
        durationSeconds,
        expiresAt: expiryDate.toISOString(),
        isDailyFeatured,
        accessTier,
        priceRupees: price,
      });

      setTitle("");
      setDescription("");
      setFile(null);
      setPriceCents("");
      setExpiresAt(null);
      setIsDailyFeatured(false);
      showToast("Video uploaded!", "celebrate");
      onUploaded();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Upload failed — try again.", "error");
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
          placeholder="Price in rupees, e.g. 199"
          value={priceRupees}
          onChangeText={setPriceCents}
          keyboardType="number-pad"
        />
      )}

      <DateTimeField
        label="Expiry date (mandatory — video is auto-deleted after this)"
        value={expiresAt}
        onChange={setExpiresAt}
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
