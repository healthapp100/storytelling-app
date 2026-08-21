import type { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

// A small, deliberately curated mapping so each topic reads as distinct at
// a glance instead of every card looking identical. Falls back to a
// generic book icon for any section slug not covered here.
const ICONS_BY_KEYWORD: Record<string, IconName> = {
  sutra: "diamond-outline",
  sloka: "musical-notes-outline",
  purana: "library-outline",
  story: "book-outline",
  chant: "musical-notes-outline",
  meditation: "moon-outline",
};

export function iconForSection(slug: string): IconName {
  const match = Object.keys(ICONS_BY_KEYWORD).find((keyword) => slug.includes(keyword));
  return match ? ICONS_BY_KEYWORD[match] : "book-outline";
}
