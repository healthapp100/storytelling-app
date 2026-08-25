import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Pressy } from "../Pressy";
import { AppTextInput } from "../AppTextInput";
import { TextButton } from "../TextButton";
import { expireVideoNow, setDailyFeatured, updateVideo } from "../../lib/adminActions";
import { useToast } from "../../lib/toast";
import { colors, radii, spacing } from "../../lib/theme";
import type { Video } from "../../types/database";

const STATUS_STYLES: Record<Video["status"], { bg: string; fg: string }> = {
  scheduled: { bg: "#FEF3C7", fg: "#92400E" },
  live: { bg: colors.successSoft, fg: colors.success },
  expired: { bg: colors.border, fg: colors.inkMuted },
  deleted: { bg: colors.border, fg: colors.inkFaint },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function AdminVideoRow({ video, onChanged }: { video: Video; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description ?? "");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const statusStyle = STATUS_STYLES[video.status];

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVideo(video.id, {
        title: title.trim(),
        description: description.trim() || null,
        durationSeconds: video.duration_seconds,
        expiresAt: video.expires_at,
        accessTier: video.access_tier,
        priceRupees: video.price_rupees,
      });
      setEditing(false);
      showToast("Video updated.", "success");
      onChanged();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't save — try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFeature = async () => {
    try {
      await setDailyFeatured(video.id);
      showToast("Set as today's video.", "success");
      onChanged();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't feature — try again.", "error");
    }
  };

  const handleExpire = () => {
    Alert.alert("Remove this video now?", "It will be purged on the next expiry sweep.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove now",
        style: "destructive",
        onPress: async () => {
          try {
            await expireVideoNow(video.id);
            showToast("Video removed.", "success");
            onChanged();
          } catch (error) {
            showToast(error instanceof Error ? error.message : "Couldn't remove — try again.", "error");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.badgeLabel, { color: statusStyle.fg }]}>{video.status}</Text>
        </View>
        {video.is_daily_featured && (
          <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.badgeLabel, { color: colors.accentInk }]}>Today&apos;s video</Text>
          </View>
        )}
      </View>
      <Text style={styles.meta}>
        Posted {formatDate(video.posted_at)} · Expires {formatDate(video.expires_at)}
        {video.access_tier === "one_time" && ` · ₹${video.price_rupees ?? 0}`}
      </Text>

      {editing ? (
        <View style={styles.editForm}>
          <AppTextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" />
          <AppTextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
          />
          <View style={styles.row}>
            <Pressy style={styles.saveButton} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveLabel}>{saving ? "Saving…" : "Save"}</Text>
            </Pressy>
            <TextButton style={styles.cancelLabel} onPress={() => setEditing(false)}>
              Cancel
            </TextButton>
          </View>
        </View>
      ) : (
        video.status === "live" && (
          <View style={styles.row}>
            <TextButton style={styles.editLabel} onPress={() => setEditing(true)}>
              Edit
            </TextButton>
            {!video.is_daily_featured && (
              <TextButton style={styles.featureLabel} onPress={handleFeature}>
                Feature
              </TextButton>
            )}
            <TextButton style={styles.deleteLabel} onPress={handleExpire}>
              Remove now
            </TextButton>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" },
  title: { fontSize: 15, fontWeight: "700", color: colors.ink, flexShrink: 1 },
  badge: { borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeLabel: { fontSize: 11, fontWeight: "700" },
  meta: { fontSize: 12, color: colors.inkMuted },
  row: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.xs },
  editLabel: { color: colors.inkMuted, fontWeight: "600", fontSize: 13 },
  featureLabel: { color: colors.accent, fontWeight: "600", fontSize: 13 },
  deleteLabel: { color: colors.danger, fontWeight: "600", fontSize: 13 },
  editForm: { gap: spacing.sm, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.ink,
  },
  saveButton: { backgroundColor: colors.night, borderRadius: radii.sm, paddingVertical: 8, paddingHorizontal: 14 },
  saveLabel: { color: "#fff", fontWeight: "700", fontSize: 13 },
  cancelLabel: { color: colors.inkMuted, fontWeight: "600", fontSize: 13, alignSelf: "center" },
});
