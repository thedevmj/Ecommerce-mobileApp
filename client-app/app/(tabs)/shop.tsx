import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "@/components/ProductCard";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatCategory } from "@/lib/format";
import { cartCount, useCartStore } from "@/store/cartStore";
import { useProductsStore } from "@/store/productStore";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low" },
  { key: "price-desc", label: "Price: high" },
  { key: "rating", label: "Top rated" },
];

export default function ShopScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const category = params.category ?? "all";
  const setCategory = (value: string) => router.setParams({ category: value });
  const { products, categories, loading, fetchProducts, fetchCategories } =
    useProductsStore();
  const count = useCartStore((state) => cartCount(state.items));

  useEffect(() => {
    if (products.length === 0) fetchProducts();
    if (categories.length === 0) fetchCategories();
  }, [products.length, categories.length, fetchProducts, fetchCategories]);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory =
        category === "all" || product.category === category;
      const matchesSearch =
        search.length === 0 ||
        product.title.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        (product.brand ?? "").toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });

    switch (sort) {
      case "price-asc":
        return [...filtered].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...filtered].sort((a, b) => b.price - a.price);
      case "rating":
        return [...filtered].sort((a, b) => b.rating.rate - a.rating.rate);
      default:
        return filtered;
    }
  }, [products, query, category, sort]);

  const isLoading = loading && products.length === 0;

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
            {products.length} products
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Shop everything
          </Text>
        </View>
        <View style={styles.titleActions}>
          <IconButton
            icon="magnify"
            accessibilityLabel="Search"
            background={theme.colors.surface}
            style={{ borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => router.push("/(tabs)/search")}
          />
          <IconButton
            icon="shopping-outline"
            accessibilityLabel={`Cart, ${count} items`}
            background={theme.colors.surface}
            style={{ borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => router.push("/(tabs)/cart")}
          />
        </View>
      </View>

      <SearchBar value={query} onChangeText={setQuery} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <Chip
          label="All"
          selected={category === "all"}
          onPress={() => setCategory("all")}
        />
        {categories.map((item) => (
          <Chip
            key={item}
            label={formatCategory(item)}
            selected={category === item}
            onPress={() => setCategory(item)}
          />
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        <Text style={[styles.resultCount, { color: theme.colors.textSecondary }]}>
          {results.length} {results.length === 1 ? "result" : "results"}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.sortChips}>
            {sortOptions.map((option) => (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityState={{ selected: sort === option.key }}
                onPress={() => setSort(option.key)}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor:
                      sort === option.key
                        ? theme.colors.text
                        : theme.colors.surfaceMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sortLabel,
                    {
                      color:
                        sort === option.key
                          ? theme.colors.textInverse
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          {header}
          <View style={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} width="48%" height={260} />
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          ListHeaderComponent={header}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ProductCard product={item} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="magnify-close"
              title="No matches found"
              message="Try a different search term or clear the category filter."
              actionLabel="Reset filters"
              onAction={() => {
                setQuery("");
                setCategory("all");
                setSort("featured");
              }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: space[7],
    paddingBottom: space[10] + space[9],
  },
  headerContent: {
    gap: space[5],
    paddingTop: space[4],
    paddingBottom: space[5],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleCopy: {
    gap: 2,
  },
  titleActions: {
    flexDirection: "row",
    gap: space[3],
  },
  eyebrow: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 26,
    letterSpacing: -0.6,
  },
  chipsRow: {
    gap: space[3],
    paddingRight: space[3],
  },
  sortRow: {
    gap: space[3],
  },
  resultCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  sortChips: {
    flexDirection: "row",
    gap: space[2],
  },
  sortChip: {
    borderRadius: radius.pill,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  sortLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
  },
  column: {
    gap: space[5],
  },
  cardWrap: {
    flex: 1,
    maxWidth: "50%",
    marginBottom: space[5],
  },
  loadingContainer: {
    paddingHorizontal: space[7],
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[5],
  },
  hidden: {
    display: "none",
  },
});
