import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import { radius, sizes, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const heights: Record<ButtonSize, number> = {
  small: 40,
  medium: sizes.touchTarget,
  large: 52,
};

const paddings: Record<ButtonSize, number> = {
  small: space[5],
  medium: space[6],
  large: space[7],
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;

  const background = {
    primary: theme.colors.brand,
    secondary: theme.colors.accent,
    outline: "transparent",
    ghost: "transparent",
    danger: theme.colors.error,
  }[variant];

  const foreground = {
    primary: theme.colors.onBrand,
    secondary: theme.colors.onAccent,
    outline: theme.colors.brand,
    ghost: theme.colors.brand,
    danger: theme.colors.textInverse,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          height: heights[size],
          paddingHorizontal: paddings[size],
          backgroundColor: background,
          borderColor:
            variant === "outline" ? theme.colors.brand : "transparent",
          borderWidth: variant === "outline" ? 1 : 0,
          opacity: isDisabled ? 0.45 : pressed ? 0.78 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? (
            <MaterialCommunityIcons
              name={icon}
              size={size === "small" ? 16 : 18}
              color={foreground}
              style={styles.icon}
            />
          ) : null}
          <Text
            style={[
              styles.text,
              {
                color: foreground,
                fontSize: size === "small" ? 13 : 15,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: space[2],
  },
  text: {
    fontFamily: typography.fontFamily.semibold,
  },
  fullWidth: {
    width: "100%",
  },
  icon: {
    marginTop: -1,
  },
});
