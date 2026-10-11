// Design tokens. The look is modelled on a palm-leaf manuscript (pothi):
// khadi-toned paper, soot-black ink, a vermilion mark used sparingly, and a
// deep peacock green for the few dark surfaces. Deliberately flat — surfaces
// are separated by hairline rules rather than drop shadows, corners are
// nearly square like cut paper, and nothing is pure white.

export const colors = {
  paper: "#F0E9D6", // khadi / palm-leaf ground
  paperRaised: "#F8F3E4", // a lighter leaf for inputs and raised plates — never pure white
  ink: "#1A1510", // soot black, warm — text color only
  inkMuted: "#5E5546",
  inkFaint: "#948A78",
  border: "#D9CEB4", // hairline between items
  rule: "#BFB293", // the heavier ruled line under headings
  night: "#16302D", // peacock green-black — dark plates, primary buttons
  nightRaised: "#1F423E",
  cream: "#F6EFDB", // text on dark plates
  accent: "#B93A1E", // vermilion — numerals, active marks, key actions
  accentSoft: "#F1DFA0", // turmeric wash — the highlighter-pen tint
  accentInk: "#5E3F00",
  success: "#2F6A43",
  successSoft: "#DDE8D2",
  danger: "#8B1E2B",
  dangerSoft: "#F1D6D2",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

// Near-square on purpose: cut paper, not soft bubbles.
export const radii = {
  sm: 2,
  md: 3,
  lg: 4,
  pill: 999,
} as const;

export const fonts = {
  display: "Eczar_700Bold",
  displayMedium: "Eczar_600SemiBold",
} as const;

// Kept under the old name so existing screens pick it up, but it's no longer
// a shadow: a hairline edge (each component sets its own fill).
export const shadow = {
  card: {
    borderWidth: 1,
    borderColor: colors.border,
  },
} as const;
