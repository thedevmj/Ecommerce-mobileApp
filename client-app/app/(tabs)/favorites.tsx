import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import CommonHeader from "@/components/CommonHeader";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuthStore } from "@/store/authStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useProductsStore } from "@/store/productStore";
import { Product } from "@/type";

export default function FavoritesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const products = useProductsStore((state) => state.products);
  const productsLoading = useProductsStore((state) => state.loading);
  const productsError = useProductsStore((state) => state.error);
  const fetchProducts = useProductsStore((state) => state.fetchProducts);
  const ids = useFavoritesStore((state) => state.ids);
  const favoritesLoading = useFavoritesStore((state) => state.isLoading);
  const favoritesSyncing = useFavoritesStore((state) => state.isSyncing);
  const favoritesError = useFavoritesStore((state) => state.error);
  const clear = useFavoritesStore((state) => state.clear);
  const removeMany = useFavoritesStore((state) => state.removeMany);
  const retrySync = useFavoritesStore((state) => state.retrySync);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [String(product.id), product])),
    [products]
  );

  const favorites = useMemo(
    () =>
      ids
        .map((id) => productsById.get(String(id)))
        .filter((product): product is Product => Boolean(product)),
    [ids, productsById]
  );

  const missingIds = useMemo(() => {
    if (products.length === 0) return [];
    return ids.filter((id) => !productsById.has(String(id)));
  }, [ids, products.length, productsById]);

  const showLoading = ids.length === 0 && (favoritesLoading || productsLoading);

  const syncLabel = favoritesSyncing
    ? "Syncing your saved items…"
    : user
      ? "Synced to your account"
      : "Saved on this device";

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProducts(), retrySync()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      "Clear all favorites?",
      "This removes every saved product from this account and device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: async () => {
            const result = await clear();

            if (result.error) {
              Toast.show({
                type: "error",
                text1: "Could not clear favorites",
                text2: result.error,
                visibilityTime: 2200,
              });
              return;
            }

            Toast.show({
              type: "success",
              text1: "Favorites cleared",
              visibilityTime: 1500,
            });
          },
        },
      ]
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.cardWrap}>
        <ProductCard product={item} />
      </View>
    ),
    []
  );

  const handleRemoveUnavailable = async () => {
    if (missingIds.length === 0) return;

    const result = await removeMany(missingIds);

    if (result.error) {
      Toast.show({
        type: "error",
        text1: "Could not remove saved items",
        text2: result.error,
        visibilityTime: 2200,
      });
      return;
    }

    Toast.show({
      type: "success",
      text1: "Unavailable items removed",
      visibilityTime: 1500,
    });
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.intro}>
        <View style={styles.introCopy}>
          <Text style={[styles.count, { color: theme.colors.textMuted }]}>
            {favorites.length} saved{" "}
            {favorites.length === 1 ? "item" : "items"}
          </Text>
          <Text style={[styles.syncLabel, { color: theme.colors.textMuted }]}>
            {syncLabel}
          </Text>
        </View>
        {ids.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all favorites"
            hitSlop={8}
            onPress={handleClear}
          >
            <Text style={[styles.clear, { color: theme.colors.error }]}>
              Clear all
            </Text>
          </Pressable>
        ) : null}
      </View>

      {favoritesError ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.colors.errorSoft,
              borderColor: theme.colors.error,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="cloud-alert-outline"
            size={18}
            color={theme.colors.error}
          />
          <View style={styles.bannerCopy}>
            <Text style={[styles.bannerTitle, { color: theme.colors.error }]}>
              Favorites may be out of sync
            </Text>
            <Text
              style={[styles.bannerText, { color: theme.colors.textSecondary }]}
            >
              {favoritesError}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry favorites sync"
            hitSlop={8}
            onPress={retrySync}
          >
            <Text style={[styles.bannerAction, { color: theme.colors.error }]}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}

      {productsError && ids.length > 0 ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.colors.warningSoft,
              borderColor: theme.colors.warning,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="wifi-off"
            size={18}
            color={theme.colors.warning}
          />
          <View style={styles.bannerCopy}>
            <Text
              style={[
                styles.bannerTitle,
                { color: theme.colors.warning },
              ]}
            >
              Could not load products
            </Text>
            <Text
              style={[styles.bannerText, { color: theme.colors.textSecondary }]}
            >
              Your saved items are safe. Check your connection and try again.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry loading products"
            hitSlop={8}
            onPress={fetchProducts}
          >
            <Text
              style={[
                styles.bannerAction,
                { color: theme.colors.warning },
              ]}
            >
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}

      {missingIds.length > 0 && favorites.length > 0 ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="archive-off-outline"
            size={18}
            color={theme.colors.textMuted}
          />
          <View style={styles.bannerCopy}>
            <Text style={[styles.bannerTitle, { color: theme.colors.text }]}>
              {missingIds.length} unavailable{" "}
              {missingIds.length === 1 ? "item" : "items"}
            </Text>
            <Text
              style={[styles.bannerText, { color: theme.colors.textMuted }]}
            >
              These products are no longer in the catalog.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove unavailable saved items"
            hitSlop={8}
            onPress={handleRemoveUnavailable}
          >
            <Text style={[styles.bannerAction, { color: theme.colors.brand }]}>
              Remove
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <CommonHeader title="Favorites" />
      {showLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.brand} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
            Loading your saved items…
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          ListHeaderComponent={header}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.brand}
              colors={[theme.colors.brand]}
            />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            productsError && ids.length > 0 ? (
              <EmptyState
                icon="wifi-off"
                title="Could not load saved items"
                message="Your favorites are safe. Check your connection and try again."
                actionLabel="Try again"
                onAction={fetchProducts}
              />
            ) : favoritesError && ids.length === 0 ? (
              <EmptyState
                icon="cloud-alert-outline"
                title="Could not load favorites"
                message="We could not reach your account favorites. Check your connection and try again."
                actionLabel="Try again"
                onAction={retrySync}
              />
            ) : ids.length > 0 ? (
              <EmptyState
                icon="archive-off-outline"
                title="Saved items unavailable"
                message="The products you saved are no longer in the catalog. Remove them to keep your favorites tidy."
                actionLabel="Remove unavailable"
                onAction={handleRemoveUnavailable}
              />
            ) : (
              <EmptyState
                icon="heart-outline"
                title="Nothing saved yet"
                message="Tap the heart on any product to keep it here for later."
                actionLabel="Browse products"
                onAction={() => router.push("/(tabs)/shop")}
              />
            )
          }
        />
      )}
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
  header: {
    gap: space[4],
    paddingBottom: space[5],
  },
  intro: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  introCopy: {
    gap: 2,
  },
  count: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  syncLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
  },
  clear: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space[3],
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space[4],
  },
  bannerCopy: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  bannerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  bannerAction: {
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
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space[4],
    paddingBottom: space[10],
  },
  loadingText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
});
