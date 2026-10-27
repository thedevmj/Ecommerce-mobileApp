import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Remove filter ${label}`}
      hitSlop={6}
      onPress={onRemove}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: theme.colors.brandSoft,
          borderColor: theme.colors.brand,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.label, { color: theme.colors.brand }]}
      >
        {label}
      </Text>
      <MaterialCommunityIcons
        name="close"
        size={14}
        color={theme.colors.brand}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    maxWidth: 220,
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    paddingHorizontal: space[5],
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
  },
});
