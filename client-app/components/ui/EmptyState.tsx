import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import Button from "@/components/Button";

interface EmptyStateProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <View
        style={[styles.orb, { backgroundColor: theme.colors.brandSoft }]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={30}
          color={theme.colors.brand}
        />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          size="small"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: space[10],
    paddingHorizontal: space[8],
  },
  orb: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space[6],
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    marginBottom: space[2],
    textAlign: "center",
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 300,
    marginBottom: space[6],
  },
});
