// Shared design tokens. Pull colors/spacing/type from here rather than
// hardcoding — keeps every screen visually consistent.
//
// Palette: warm parchment ground + deep indigo "night" surfaces + marigold
// gold accent — evokes lamp-lit night storytelling and temple gold, deliberately
// steering away from the cream+terracotta combination that reads as a
// generic AI-generated palette. `ink` is a TEXT color only; `night` is the
// dedicated dark-surface background (hero cards, primary buttons) — kept
// separate so text and background roles never collide when either changes.

export const colors = {
  paper: "#F7F2E7", // warm parchment ground, not stark white
  paperRaised: "#FFFFFF",
  ink: "#231E33", // near-black with an indigo bias — text color only
  inkMuted: "#655D78",
  inkFaint: "#9C93AE",
  border: "#E7DED0",
  night: "#211B36", // deep indigo — hero cards, primary buttons, nav accents
  nightRaised: "#2C2447",
  accent: "#C98A1F", // marigold/temple gold — the one warm accent
  accentSoft: "#F5E4C2",
  accentInk: "#7A5511",
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
    shadowColor: "#211B36",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
} as const;
