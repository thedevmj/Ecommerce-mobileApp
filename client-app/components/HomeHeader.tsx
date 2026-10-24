import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Logo from "./Logo";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { cartCount, useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";

const HomeHeader = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const count = useCartStore((state) => cartCount(state.items));
  const favoriteCount = useFavoritesStore((state) => state.ids.length);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ backgroundColor: theme.colors.background }}
    >
      <View style={styles.header}>
        <Logo />
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search"
            onPress={() => router.push("/(tabs)/search")}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={21}
              color={theme.colors.text}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Favorites, ${favoriteCount} items`}
            onPress={() => router.push("/(tabs)/favorites")}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={favoriteCount > 0 ? "heart" : "heart-outline"}
              size={21}
              color={favoriteCount > 0 ? theme.colors.error : theme.colors.text}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Cart, ${count} items`}
            onPress={() => router.push("/(tabs)/cart")}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="shopping-outline"
              size={21}
              color={theme.colors.text}
            />
            {count > 0 ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.background,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.colors.onAccent }]}>
                  {count > 9 ? "9+" : count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space[7],
    paddingTop: space[3],
    paddingBottom: space[4],
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 9,
  },
});
