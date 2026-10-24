import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { cartCount, useCartStore } from "@/store/cartStore";

interface Props {
  title?: string;
  isFav?: boolean;
  showFavorite?: boolean;
  handleToggleFavorite?: () => void;
}

const CommonHeader = ({
  title,
  isFav = false,
  showFavorite = false,
  handleToggleFavorite,
}: Props) => {
  const router = useRouter();
  const theme = useAppTheme();
  const count = useCartStore((state) => cartCount(state.items));

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ backgroundColor: theme.colors.background }}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={handleGoBack}
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
            name="arrow-left"
            size={21}
            color={theme.colors.text}
          />
        </Pressable>

        {title ? (
          <Text
            numberOfLines={1}
            style={[styles.title, { color: theme.colors.text }]}
          >
            {title}
          </Text>
        ) : (
          <View style={styles.spacer} />
        )}

        <View style={styles.actions}>
          {showFavorite ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isFav ? "Remove from favorites" : "Add to favorites"
              }
              accessibilityState={{ selected: isFav }}
              onPress={handleToggleFavorite}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: isFav
                    ? theme.colors.errorSoft
                    : theme.colors.surface,
                  borderColor: isFav ? theme.colors.error : theme.colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isFav ? "heart" : "heart-outline"}
                size={20}
                color={isFav ? theme.colors.error : theme.colors.text}
              />
            </Pressable>
          ) : null}
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
              size={20}
              color={theme.colors.text}
            />
            {count > 0 ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: theme.colors.accent },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: theme.colors.onAccent }]}
                >
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

export default CommonHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[5],
    paddingHorizontal: space[7],
    paddingTop: space[3],
    paddingBottom: space[4],
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    textAlign: "center",
  },
  spacer: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: space[3],
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 9,
  },
});
