import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { Pressy } from "../Pressy";
import { TextButton } from "../TextButton";
import { deleteSection, updateSection } from "../../lib/adminActions";
import { colors, radii, spacing } from "../../lib/theme";
import type { Section } from "../../types/database";

export function AdminSectionRow({ section, onChanged }: { section: Section; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSection(section.id, {
        title: title.trim(),
        description: description.trim() || null,
        displayOrder: section.display_order,
      });
      setEditing(false);
      onChanged();
    } catch (error) {
      Alert.alert("Couldn't save", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete section?",
      `"${section.title}" and all its videos will be removed. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSection(section.id);
              onChanged();
            } catch (error) {
              Alert.alert("Couldn't delete", error instanceof Error ? error.message : "Try again.");
            }
          },
        },
      ]
    );
  };

  if (editing) {
    return (
      <View style={styles.card}>
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
          <TextButton style={styles.cancelLabel} onPress={() => setEditing(false)}>
            Cancel
          </TextButton>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Pressy
        style={styles.rowContent}
        onPress={() => router.push({ pathname: "/admin-section/[id]", params: { id: section.id, title: section.title } })}
      >
        <View style={styles.titleCol}>
          <Text style={styles.title} numberOfLines={2}>
            {section.title}
          </Text>
          {section.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {section.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.manageIconWrap}>
          <Ionicons name="videocam-outline" size={16} color={colors.accentInk} />
        </View>
      </Pressy>
      <View style={styles.row}>
        <TextButton style={styles.editLabel} onPress={() => setEditing(true)}>
          Edit
        </TextButton>
        <TextButton style={styles.deleteLabel} onPress={handleDelete}>
          Delete
        </TextButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowContent: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  titleCol: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: "700", color: colors.ink },
  description: { fontSize: 13, color: colors.inkMuted },
  manageIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", gap: spacing.lg },
  editLabel: { color: colors.inkMuted, fontWeight: "600", fontSize: 13 },
  deleteLabel: { color: colors.danger, fontWeight: "600", fontSize: 13 },
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
