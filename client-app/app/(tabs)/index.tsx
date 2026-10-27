import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import HomeHeader from "@/components/HomeHeader";
import ProductCard from "@/components/ProductCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { radius, shadows, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatCategory } from "@/lib/format";
import { useProductsStore } from "@/store/productStore";

const categoryIcons: Record<
  string,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  beauty: "lipstick",
  fragrances: "spray",
  furniture: "sofa-outline",
  groceries: "basket-outline",
  "home-decoration": "lamp-outline",
  "kitchen-accessories": "silverware-fork-knife",
  laptops: "laptop",
  "mens-shirts": "tshirt-crew-outline",
  "mens-shoes": "shoe-sneaker",
  "mens-watches": "watch-variant",
  "mobile-accessories": "cellphone",
  motorcycle: "motorbike",
  "skin-care": "hand-heart-outline",
  smartphones: "cellphone",
  "sports-accessories": "dumbbell",
  sunglasses: "sunglasses",
  tablets: "tablet",
  tops: "tshirt-crew-outline",
  vehicle: "car-outline",
  "womens-bags": "bag-personal-outline",
  "womens-dresses": "hanger",
  "womens-jewellery": "necklace",
  "womens-shoes": "shoe-heel",
  "womens-watches": "watch-variant",
};

const trustItems = [
  { icon: "truck-fast-outline", label: "Free shipping" },
  { icon: "cash-multiple", label: "Cash on delivery" },
  { icon: "backup-restore", label: "30-day returns" },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const {
    products,
    categories,
    loading,
    error,
    fetchProducts,
    fetchCategories,
  } = useProductsStore();

  const featuredProducts = useMemo(() => products.slice(0, 6), [products]);
  const newArrivals = useMemo(() => products.slice(6, 14), [products]);
  const topCategories = useMemo(() => categories.slice(0, 10), [categories]);
  const isLoading = loading && products.length === 0;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchCategories()]);
    setRefreshing(false);
  }, [fetchProducts, fetchCategories]);

  const navigateToCategory = (category: string) => {
    router.push({ pathname: "/(tabs)/shop", params: { category } });
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <HomeHeader />
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.skeletonContainer}>
          <Skeleton height={180} style={styles.heroSkeleton} />
          <Skeleton width="40%" height={20} style={styles.skeletonTitle} />
          <View style={styles.skeletonRow}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} width={158} height={220} />
            ))}
          </View>
          <Skeleton width="50%" height={20} style={styles.skeletonTitle} />
          <View style={styles.grid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} width="48%" height={250} />
            ))}
          </View>
        </ScrollView>
      ) : error && products.length === 0 ? (
        <SafeAreaView style={styles.errorContainer} edges={["bottom"]}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={36}
            color={theme.colors.textMuted}
          />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            {"We couldn't load the store"}
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <Button title="Try again" onPress={() => fetchProducts()} />
        </SafeAreaView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.brand}
              colors={[theme.colors.brand]}
            />
          }
        >
          <SearchBar
            value=""
            onChangeText={() => {}}
            onPress={() => router.push("/(tabs)/search")}
            style={styles.search}
          />

          <View
            style={[styles.hero, { backgroundColor: theme.colors.brand }]}
          >
            <View style={styles.heroOrbLarge} />
            <View style={styles.heroOrbSmall} />
            <View style={styles.heroCopy}>
              <Text style={[styles.heroEyebrow, { color: theme.colors.onBrand }]}>
                NEW SEASON
              </Text>
              <Text style={[styles.heroTitle, { color: theme.colors.onBrand }]}>
                Everyday essentials,{"\n"}up to 40% off
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(tabs)/shop")}
                style={({ pressed }) => [
                  styles.heroCta,
                  {
                    backgroundColor: theme.colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.heroCtaText, { color: theme.colors.brand }]}>
                  Shop the drop
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={16}
                  color={theme.colors.brand}
                />
              </Pressable>
            </View>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons
                name="shopping-outline"
                size={74}
                color="rgba(255,255,255,0.18)"
              />
            </View>
          </View>

          <View style={styles.trustRow}>
            {trustItems.map((item) => (
              <View key={item.label} style={styles.trustItem}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={18}
                  color={theme.colors.brand}
                />
                <Text
                  style={[styles.trustText, { color: theme.colors.textSecondary }]}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Shop by category"
              actionLabel="See all"
              onAction={() => router.push("/(tabs)/shop")}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {topCategories.map((category) => (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${formatCategory(category)}`}
                  onPress={() => navigateToCategory(category)}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: theme.colors.brandSoft },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={categoryIcons[category] ?? "tag-outline"}
                      size={20}
                      color={theme.colors.brand}
                    />
                  </View>
                  <Text
                    numberOfLines={2}
                    style={[styles.categoryLabel, { color: theme.colors.text }]}
                  >
                    {formatCategory(category)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Featured picks"
              actionLabel="See all"
              onAction={() => router.push("/(tabs)/shop")}
            />
            <FlatList
              data={featuredProducts}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredRow}
              renderItem={({ item }) => <ProductCard product={item} compact />}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="New arrivals"
              actionLabel="Browse all"
              onAction={() => router.push("/(tabs)/shop")}
            />
            <View style={styles.grid}>
              {newArrivals.map((product) => (
                <View key={product.id} style={styles.gridItem}>
                  <ProductCard product={product} />
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.banner,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[styles.bannerIcon, { backgroundColor: theme.colors.accentSoft }]}
            >
              <MaterialCommunityIcons
                name="gift-outline"
                size={22}
                color={theme.colors.accent}
              />
            </View>
            <View style={styles.bannerCopy}>
              <Text style={[styles.bannerTitle, { color: theme.colors.text }]}>
                Members save more
              </Text>
              <Text
                style={[styles.bannerText, { color: theme.colors.textSecondary }]}
              >
                Create a free account for early access to drops.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/auth")}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.textMuted}
              />
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space[7],
    paddingBottom: space[10] + space[9],
    gap: space[8],
  },
  search: {
    marginTop: space[1],
  },
  hero: {
    borderRadius: radius.lg,
    padding: space[7],
    minHeight: 168,
    overflow: "hidden",
    justifyContent: "center",
  },
  heroOrbLarge: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    right: -60,
    top: -70,
  },
  heroOrbSmall: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    right: 40,
    bottom: -60,
  },
  heroCopy: {
    maxWidth: "78%",
    gap: space[3],
  },
  heroEyebrow: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 1.6,
    opacity: 0.8,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: space[2],
    height: 38,
    paddingHorizontal: space[6],
    borderRadius: radius.pill,
    marginTop: space[2],
  },
  heroCtaText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
  heroIcon: {
    position: "absolute",
    right: space[5],
    bottom: space[5],
  },
  trustRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: space[3],
    marginTop: -space[3],
  },
  trustItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[2],
  },
  trustText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
  },
  section: {
    gap: space[5],
  },
  categoriesRow: {
    gap: space[4],
    paddingRight: space[2],
  },
  categoryCard: {
    width: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space[4],
    gap: space[3],
    alignItems: "flex-start",
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  featuredRow: {
    paddingRight: space[2],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[5],
  },
  gridItem: {
    width: "48%",
    flexGrow: 1,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[5],
    padding: space[5],
    borderRadius: radius.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerCopy: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
  },
  bannerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space[8],
    gap: space[4],
  },
  errorTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    textAlign: "center",
    marginBottom: space[3],
  },
  skeletonContainer: {
    padding: space[7],
    gap: space[6],
  },
  heroSkeleton: {
    borderRadius: radius.lg,
  },
  skeletonTitle: {
    marginTop: space[3],
  },
  skeletonRow: {
    flexDirection: "row",
    gap: space[5],
    overflow: "hidden",
  },
});
