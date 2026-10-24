export const palette = {
  white: "#FFFFFF",
  black: "#000000",
  blue: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },
  orange: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316",
    600: "#EA580C",
    700: "#C2410C",
  },
  slate: {
    0: "#FFFFFF",
    25: "#FCFCFD",
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#020617",
  },
  green: {
    100: "#D1FAE5",
    500: "#10B981",
    600: "#059669",
    700: "#047857",
  },
  amber: {
    100: "#FEF3C7",
    500: "#F59E0B",
    600: "#D97706",
  },
  red: {
    100: "#FEE2E2",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
  },
} as const;

export const space = {
  0: 0,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 12,
  6: 16,
  7: 20,
  8: 24,
  9: 32,
  10: 40,
  11: 48,
  12: 64,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  fontFamily: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  display: { fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  h1: { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  h3: { fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  title: { fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  bodySmall: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  overline: { fontSize: 11, lineHeight: 14, letterSpacing: 1.2 },
} as const;

export const sizes = {
  touchTarget: 44,
  inputHeight: 48,
  headerHeight: 56,
  tabBarHeight: 64,
  contentMaxWidth: 720,
} as const;

export const shadows = {
  none: {},
  sm: {
    shadowColor: palette.slate[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: palette.slate[900],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: palette.slate[900],
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
} as const;

export type ColorScheme = "light" | "dark";

export interface Theme {
  scheme: ColorScheme;
  colors: {
    background: string;
    backgroundElevated: string;
    surface: string;
    surfaceMuted: string;
    surfaceInverse: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    border: string;
    borderStrong: string;
    brand: string;
    brandPressed: string;
    brandSoft: string;
    onBrand: string;
    accent: string;
    accentSoft: string;
    onAccent: string;
    success: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    error: string;
    errorSoft: string;
    overlay: string;
    skeleton: string;
  };
}

export const lightTheme: Theme = {
  scheme: "light",
  colors: {
    background: palette.slate[50],
    backgroundElevated: palette.white,
    surface: palette.white,
    surfaceMuted: palette.slate[100],
    surfaceInverse: palette.slate[900],
    text: palette.slate[900],
    textSecondary: palette.slate[600],
    textMuted: palette.slate[500],
    textInverse: palette.white,
    border: palette.slate[200],
    borderStrong: palette.slate[300],
    brand: palette.blue[600],
    brandPressed: palette.blue[700],
    brandSoft: palette.blue[50],
    onBrand: palette.white,
    accent: palette.orange[500],
    accentSoft: palette.orange[50],
    onAccent: palette.slate[950],
    success: palette.green[600],
    successSoft: palette.green[100],
    warning: palette.amber[600],
    warningSoft: palette.amber[100],
    error: palette.red[600],
    errorSoft: palette.red[100],
    overlay: "rgba(15, 23, 42, 0.48)",
    skeleton: palette.slate[200],
  },
};

export const darkTheme: Theme = {
  scheme: "dark",
  colors: {
    background: "#0B1120",
    backgroundElevated: "#111827",
    surface: "#111827",
    surfaceMuted: "#1E293B",
    surfaceInverse: palette.slate[50],
    text: palette.slate[50],
    textSecondary: palette.slate[300],
    textMuted: palette.slate[400],
    textInverse: palette.slate[900],
    border: "#243047",
    borderStrong: "#334155",
    brand: palette.blue[400],
    brandPressed: palette.blue[500],
    brandSoft: "rgba(96, 165, 250, 0.12)",
    onBrand: palette.slate[950],
    accent: palette.orange[400],
    accentSoft: "rgba(251, 146, 60, 0.12)",
    onAccent: palette.slate[950],
    success: palette.green[500],
    successSoft: "rgba(16, 185, 129, 0.12)",
    warning: palette.amber[500],
    warningSoft: "rgba(245, 158, 11, 0.12)",
    error: palette.red[500],
    errorSoft: "rgba(239, 68, 68, 0.12)",
    overlay: "rgba(2, 6, 23, 0.72)",
    skeleton: "#1E293B",
  },
};

export const getTheme = (scheme: ColorScheme = "light"): Theme =>
  scheme === "dark" ? darkTheme : lightTheme;
