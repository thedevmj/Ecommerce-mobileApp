import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? theme.colors.brand
            : theme.colors.surface,
          borderColor: selected ? theme.colors.brand : theme.colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? theme.colors.onBrand : theme.colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: space[5],
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
  },
});
