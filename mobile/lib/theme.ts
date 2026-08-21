// Shared design tokens. Pull colors/spacing/type from here rather than
// hardcoding — keeps every screen visually consistent.

export const colors = {
  paper: "#FBF7F0", // warm off-white ground, not a stark white
  paperRaised: "#FFFFFF",
  ink: "#241F18", // near-black with a warm bias, not pure black
  inkMuted: "#6B6153",
  inkFaint: "#9C9384",
  border: "#E7DFD1",
  accent: "#B5551E", // terracotta/saffron — the one warm accent
  accentSoft: "#F3E4D6",
  accentInk: "#5C2A0E",
  success: "#3F6B4A",
  successSoft: "#E5EFE6",
  danger: "#B23A2E",
  dangerSoft: "#F8E6E1",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayItalic: "Fraunces_500Medium_Italic",
} as const;

export const shadow = {
  card: {
    shadowColor: "#241F18",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
