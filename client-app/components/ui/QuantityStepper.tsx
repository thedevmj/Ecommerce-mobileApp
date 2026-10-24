import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, sizes, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  compact = false,
}: QuantityStepperProps) {
  const theme = useAppTheme();
  const cell = compact ? 36 : sizes.touchTarget;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.surfaceMuted }]}
      accessibilityLabel="Quantity selector"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={value <= min}
        hitSlop={6}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.cell, { width: cell, height: cell }]}
      >
        <MaterialCommunityIcons
          name="minus"
          size={compact ? 16 : 18}
          color={value <= min ? theme.colors.textMuted : theme.colors.text}
        />
      </Pressable>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={value >= max}
        hitSlop={6}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.cell, { width: cell, height: cell }]}
      >
        <MaterialCommunityIcons
          name="plus"
          size={compact ? 16 : 18}
          color={value >= max ? theme.colors.textMuted : theme.colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    minWidth: 28,
    textAlign: "center",
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
  },
});
