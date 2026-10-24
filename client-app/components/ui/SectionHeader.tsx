import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  eyebrow?: string;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  eyebrow,
}: SectionHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={[styles.action, { color: theme.colors.brand }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space[4],
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: space[1],
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  action: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
    paddingBottom: 2,
  },
});
