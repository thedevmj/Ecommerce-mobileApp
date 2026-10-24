import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

const Logo = () => {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Shopcart home"
      onPress={() => router.push("/")}
      style={({ pressed }) => [
        styles.logoView,
        { backgroundColor: theme.colors.brand, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <MaterialCommunityIcons
        name="shopping"
        size={22}
        color={theme.colors.onBrand}
      />
      <Text style={[styles.logoText, { color: theme.colors.text }]}>
        shopcart
      </Text>
    </Pressable>
  );
};

export default Logo;

const styles = StyleSheet.create({
  logoView: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    height: 42,
    paddingLeft: space[2],
    paddingRight: space[4],
    borderRadius: radius.sm,
  },
  logoText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    letterSpacing: -0.4,
  },
});
