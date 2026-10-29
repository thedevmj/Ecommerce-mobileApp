export const palette = {
  white: "#FFFFFF",
  black: "#000000",
  red: {
    50: "#FFF1EF",
    100: "#FFE1DD",
    200: "#FFC8C1",
    300: "#FFA39A",
    400: "#F45B4A",
    500: "#D90000",
    600: "#B80000",
    700: "#910000",
    800: "#6B0000",
    900: "#4A0000",
  },
  yellow: {
    50: "#FFFCEB",
    100: "#FFF7D1",
    200: "#FFEA93",
    300: "#F2D96A",
    400: "#D4B43F",
    500: "#A88613",
    600: "#806500",
    700: "#624D00",
  },
  olive: {
    50: "#F5F8EC",
    100: "#E9F1D6",
    200: "#D8E6BA",
    300: "#BFD592",
    400: "#A6C46A",
    500: "#8DB355",
    600: "#6F913D",
    700: "#56732E",
    800: "#405724",
    900: "#2C3D1A",
  },
  ink: {
    0: "#FFFFFF",
    25: "#FBF9F4",
    50: "#F6F3EA",
    100: "#EBE6D8",
    200: "#DAD3C0",
    300: "#BDB49D",
    400: "#938A75",
    500: "#6D6554",
    600: "#514A3D",
    700: "#383329",
    800: "#24211B",
    900: "#000000",
    950: "#000000",
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
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: palette.black,
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
    background: palette.white,
    backgroundElevated: palette.white,
    surface: palette.white,
    surfaceMuted: palette.yellow[50],
    surfaceInverse: palette.black,
    text: palette.black,
    textSecondary: palette.ink[600],
    textMuted: palette.ink[500],
    textInverse: palette.white,
    border: palette.ink[200],
    borderStrong: palette.ink[300],
    brand: palette.red[500],
    brandPressed: palette.red[600],
    brandSoft: palette.red[50],
    onBrand: palette.white,
    accent: palette.olive[500],
    accentSoft: palette.olive[50],
    onAccent: palette.white,
    success: palette.olive[600],
    successSoft: palette.olive[100],
    warning: palette.yellow[600],
    warningSoft: palette.yellow[200],
    error: palette.red[600],
    errorSoft: palette.red[100],
    overlay: "rgba(0, 0, 0, 0.48)",
    skeleton: palette.ink[200],
  },
};

export const darkTheme: Theme = {
  scheme: "dark",
  colors: {
    background: "#000000",
    backgroundElevated: "#121212",
    surface: "#121212",
    surfaceMuted: "#1F1F1F",
    surfaceInverse: palette.white,
    text: palette.white,
    textSecondary: palette.ink[200],
    textMuted: palette.ink[300],
    textInverse: palette.black,
    border: "#2A2A2A",
    borderStrong: "#3A3A3A",
    brand: palette.red[500],
    brandPressed: palette.red[400],
    brandSoft: "rgba(217, 0, 0, 0.16)",
    onBrand: palette.white,
    accent: palette.olive[400],
    accentSoft: "rgba(141, 179, 85, 0.16)",
    onAccent: palette.black,
    success: palette.olive[400],
    successSoft: "rgba(141, 179, 85, 0.16)",
    warning: palette.yellow[300],
    warningSoft: "rgba(255, 234, 147, 0.18)",
    error: palette.red[400],
    errorSoft: "rgba(244, 91, 74, 0.16)",
    overlay: "rgba(0, 0, 0, 0.72)",
    skeleton: "#2A2A2A",
  },
};

export const getTheme = (scheme: ColorScheme = "light"): Theme =>
  scheme === "dark" ? darkTheme : lightTheme;
