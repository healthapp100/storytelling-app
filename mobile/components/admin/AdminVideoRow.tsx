import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Pressy } from "../Pressy";
import { expireVideoNow, setDailyFeatured, updateVideo } from "../../lib/adminActions";
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
        priceCents: video.price_cents,
      });
      setEditing(false);
      onChanged();
    } catch (error) {
      Alert.alert("Couldn't save", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFeature = async () => {
    try {
      await setDailyFeatured(video.id);
      onChanged();
    } catch (error) {
      Alert.alert("Couldn't feature", error instanceof Error ? error.message : "Try again.");
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
            onChanged();
          } catch (error) {
            Alert.alert("Couldn't remove", error instanceof Error ? error.message : "Try again.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{video.title}</Text>
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
        {video.access_tier === "one_time" && ` · $${((video.price_cents ?? 0) / 100).toFixed(2)}`}
      </Text>

      {editing ? (
        <View style={styles.editForm}>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" />
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
          />
          <View style={styles.row}>
            <Pressy style={styles.saveButton} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveLabel}>{saving ? "Saving…" : "Save"}</Text>
            </Pressy>
            <Pressable onPress={() => setEditing(false)}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        video.status === "live" && (
          <View style={styles.row}>
            <Pressable onPress={() => setEditing(true)}>
              <Text style={styles.editLabel}>Edit</Text>
            </Pressable>
            {!video.is_daily_featured && (
              <Pressable onPress={handleFeature}>
                <Text style={styles.featureLabel}>Feature</Text>
              </Pressable>
            )}
            <Pressable onPress={handleExpire}>
              <Text style={styles.deleteLabel}>Remove now</Text>
            </Pressable>
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
  title: { fontSize: 15, fontWeight: "700", color: colors.ink },
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
  saveButton: { backgroundColor: colors.ink, borderRadius: radii.sm, paddingVertical: 8, paddingHorizontal: 14 },
  saveLabel: { color: "#fff", fontWeight: "700", fontSize: 13 },
  cancelLabel: { color: colors.inkMuted, fontWeight: "600", fontSize: 13, alignSelf: "center" },
});
