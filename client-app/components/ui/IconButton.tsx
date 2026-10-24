import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { radius, sizes } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface IconButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  color?: string;
  background?: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 20,
  color,
  background,
  active = false,
  style,
}: IconButtonProps) {
  const theme = useAppTheme();
  const resolvedColor = active
    ? theme.colors.error
    : color ?? theme.colors.text;
  const resolvedBackground = background ?? theme.colors.surfaceMuted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: resolvedBackground,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={size}
        color={resolvedColor}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
