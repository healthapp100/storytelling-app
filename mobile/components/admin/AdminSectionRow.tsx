import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { Pressy } from "../Pressy";
import { AppTextInput } from "../AppTextInput";
import { TextButton } from "../TextButton";
import { deleteSection, updateSection } from "../../lib/adminActions";
import { storagePublicUrl } from "../../lib/queries";
import { uploadLocalFileToStorage } from "../../lib/storageUpload";
import { useToast } from "../../lib/toast";
import { colors, radii, spacing } from "../../lib/theme";
import type { Section } from "../../types/database";

export function AdminSectionRow({ section, onChanged }: { section: Section; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description ?? "");
  const [icon, setIcon] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const pickIcon = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "image/*" });
    if (!result.canceled && result.assets?.[0]) setIcon(result.assets[0]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let iconUrl = section.icon_url;
      if (icon) {
        const { storageKey } = await uploadLocalFileToStorage(
          icon.uri,
          icon.name ?? "icon.jpg",
          icon.mimeType ?? "image/jpeg",
          "images"
        );
        iconUrl = storagePublicUrl(storageKey);
      }
      await updateSection(section.id, {
        title: title.trim(),
        description: description.trim() || null,
        displayOrder: section.display_order,
        iconUrl,
      });
      setEditing(false);
      setIcon(null);
      showToast("Section updated.", "success");
      onChanged();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't save — try again.", "error");
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
              showToast("Section deleted.", "success");
              onChanged();
            } catch (error) {
              showToast(error instanceof Error ? error.message : "Couldn't delete — try again.", "error");
            }
          },
        },
      ]
    );
  };

  if (editing) {
    return (
      <View style={styles.card}>
        <AppTextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" />
        <AppTextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
        />
        <Pressy style={styles.iconPicker} onPress={pickIcon}>
          {icon ? (
            <Image source={{ uri: icon.uri }} style={styles.iconPreview} />
          ) : section.icon_url ? (
            <Image source={{ uri: section.icon_url }} style={styles.iconPreview} />
          ) : (
            <Text style={styles.iconPickerLabel}>Choose an icon image (optional)</Text>
          )}
        </Pressy>
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
          {section.icon_url ? (
            <Image source={{ uri: section.icon_url }} style={styles.manageIconImage} />
          ) : (
            <Ionicons name="videocam-outline" size={16} color={colors.accentInk} />
          )}
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
    overflow: "hidden",
  },
  manageIconImage: { width: 32, height: 32 },
  iconPicker: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconPickerLabel: { color: colors.inkMuted, fontWeight: "600", fontSize: 13 },
  iconPreview: { width: "100%", height: 90, borderRadius: radii.sm },
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
