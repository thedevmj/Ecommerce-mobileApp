import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import CommonHeader from "@/components/CommonHeader";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useProductsStore } from "@/store/productStore";

export default function FavoritesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { products, fetchProducts } = useProductsStore();
  const ids = useFavoritesStore((state) => state.ids);
  const clear = useFavoritesStore((state) => state.clear);

  useEffect(() => {
    if (products.length === 0) fetchProducts();
  }, [products.length, fetchProducts]);

  const favorites = useMemo(
    () => products.filter((product) => ids.includes(product.id)),
    [products, ids]
  );

  const header = (
    <View style={styles.intro}>
      <Text style={[styles.count, { color: theme.colors.textMuted }]}>
        {favorites.length} saved {favorites.length === 1 ? "item" : "items"}
      </Text>
      {favorites.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear all favorites"
          hitSlop={8}
          onPress={clear}
        >
          <Text style={[styles.clear, { color: theme.colors.error }]}>
            Clear all
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <CommonHeader title="Favorites" />
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ProductCard product={item} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Nothing saved yet"
            message="Tap the heart on any product to keep it here for later."
            actionLabel="Browse products"
            onAction={() => router.push("/(tabs)/shop")}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space[7],
    paddingBottom: space[10] + space[9],
  },
  intro: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: space[5],
  },
  count: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  clear: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  column: {
    gap: space[5],
  },
  cardWrap: {
    flex: 1,
    maxWidth: "50%",
    marginBottom: space[5],
  },
});
