import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatPrice } from "@/lib/format";

interface PriceProps {
  price: number;
  compareAtPrice?: number;
  size?: "small" | "medium" | "large";
}

export function Price({ price, compareAtPrice, size = "medium" }: PriceProps) {
  const theme = useAppTheme();
  const fontSize = { small: 14, medium: 17, large: 26 }[size];

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.price,
          { fontSize, color: theme.colors.text },
        ]}
        accessibilityLabel={formatPrice(price)}
      >
        {formatPrice(price)}
      </Text>
      {compareAtPrice && compareAtPrice > price ? (
        <Text
          style={[styles.compare, { color: theme.colors.textMuted }]}
          accessibilityLabel={`Original price ${formatPrice(compareAtPrice)}`}
        >
          {formatPrice(compareAtPrice)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: space[2],
  },
  price: {
    fontFamily: typography.fontFamily.bold,
    letterSpacing: -0.3,
  },
  compare: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    textDecorationLine: "line-through",
  },
});
