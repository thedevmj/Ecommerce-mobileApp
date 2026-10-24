import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

type BadgeTone = "sale" | "stock" | "low" | "out" | "brand";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = "brand" }: BadgeProps) {
  const theme = useAppTheme();

  const tones = {
    sale: { background: theme.colors.accentSoft, color: theme.colors.accent },
    stock: { background: theme.colors.successSoft, color: theme.colors.success },
    low: { background: theme.colors.warningSoft, color: theme.colors.warning },
    out: { background: theme.colors.errorSoft, color: theme.colors.error },
    brand: { background: theme.colors.brandSoft, color: theme.colors.brand },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: tones.background }]}>
      <Text style={[styles.label, { color: tones.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.xs,
    paddingHorizontal: space[4],
    paddingVertical: space[1],
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    lineHeight: 16,
  },
});
