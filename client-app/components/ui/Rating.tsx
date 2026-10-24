import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface RatingProps {
  rate: number;
  count?: number;
  size?: number;
  showCount?: boolean;
}

export function Rating({
  rate,
  count,
  size = 13,
  showCount = true,
}: RatingProps) {
  const theme = useAppTheme();
  const rounded = Math.round(rate);

  return (
    <View
      style={styles.row}
      accessibilityLabel={`Rated ${rate.toFixed(1)} out of 5${
        count ? ` from ${count} reviews` : ""
      }`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <MaterialCommunityIcons
          key={index}
          name={index < rounded ? "star" : "star-outline"}
          size={size}
          color={theme.colors.warning}
        />
      ))}
      <Text style={[styles.rate, { color: theme.colors.textSecondary }]}>
        {rate.toFixed(1)}
      </Text>
      {showCount && count ? (
        <Text style={[styles.count, { color: theme.colors.textMuted }]}>
          ({count})
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  rate: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
    marginLeft: space[2],
  },
  count: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    marginLeft: space[1],
  },
});
