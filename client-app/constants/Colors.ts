import { darkTheme, lightTheme, palette } from "./theme";

const AppColors = {
  primary: palette.blue,
  accent: palette.orange,
  gray: palette.slate,
  success: lightTheme.colors.success,
  error: lightTheme.colors.error,
  warning: lightTheme.colors.warning,
  background: {
    primary: lightTheme.colors.background,
    secondary: lightTheme.colors.surfaceMuted,
    tertiary: palette.slate[200],
  },
  text: {
    primary: lightTheme.colors.text,
    secondary: lightTheme.colors.textSecondary,
    tertiary: lightTheme.colors.textMuted,
    inverse: lightTheme.colors.textInverse,
  },
};

export const Colors = {
  light: {
    text: lightTheme.colors.text,
    background: lightTheme.colors.background,
    tint: lightTheme.colors.brand,
    icon: lightTheme.colors.textMuted,
    tabIconDefault: lightTheme.colors.textMuted,
    tabIconSelected: lightTheme.colors.brand,
  },
  dark: {
    text: darkTheme.colors.text,
    background: darkTheme.colors.background,
    tint: darkTheme.colors.brand,
    icon: darkTheme.colors.textMuted,
    tabIconDefault: darkTheme.colors.textMuted,
    tabIconSelected: darkTheme.colors.brand,
  },
};

export type AppColorScheme = keyof typeof Colors;

export default AppColors;
