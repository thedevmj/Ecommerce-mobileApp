import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FilterSheet from "@/components/FilterSheet";
import ProductCard from "@/components/ProductCard";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip } from "@/components/ui/FilterChip";
import { IconButton } from "@/components/ui/IconButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatCategory } from "@/lib/format";
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  ShopFilters,
  SortKey,
  activeFilterCount,
  countResults as countMatchingResults,
  getActiveFilters,
  getBrands,
  getPriceBounds,
  getPricePresets,
  selectProducts,
} from "@/lib/shopFilters";
import { cartCount, useCartStore } from "@/store/cartStore";
import { useProductsStore } from "@/store/productStore";

export default function ShopScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>(DEFAULT_SORT);
  const [filters, setFilters] = useState<ShopFilters>(DEFAULT_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const category = params.category ?? "all";
  const setCategory = (value: string) => router.setParams({ category: value });
  const { products, categories, loading, fetchProducts, fetchCategories } =
    useProductsStore();
  const count = useCartStore((state) => cartCount(state.items));

  useEffect(() => {
    if (products.length === 0) fetchProducts();
    if (categories.length === 0) fetchCategories();
  }, [products.length, categories.length, fetchProducts, fetchCategories]);

  const brands = useMemo(() => getBrands(products), [products]);
  const bounds = useMemo(() => getPriceBounds(products), [products]);
  const presets = useMemo(() => getPricePresets(bounds), [bounds]);

  const results = useMemo(
    () => selectProducts(products, { query, category, filters, sort }),
    [products, query, category, filters, sort]
  );

  const activeFilters = useMemo(() => getActiveFilters(filters), [filters]);
  const filterCount = activeFilterCount(filters);

  const countForFilters = useCallback(
    (draft: ShopFilters) =>
      countMatchingResults(products, { query, category, filters: draft }),
    [products, query, category]
  );

  const resetAll = () => {
    setQuery("");
    setCategory("all");
    setSort(DEFAULT_SORT);
    setFilters(DEFAULT_FILTERS);
  };

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

      <View style={styles.controlsRow}>
        <Text style={[styles.resultCount, { color: theme.colors.textSecondary }]}>
          {results.length} {results.length === 1 ? "result" : "results"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            filterCount > 0
              ? `Filter and sort, ${filterCount} filters active`
              : "Filter and sort"
          }
          accessibilityState={{ expanded: filtersVisible }}
          onPress={() => setFiltersVisible(true)}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor:
                filterCount > 0 ? theme.colors.brandSoft : theme.colors.surface,
              borderColor:
                filterCount > 0 ? theme.colors.brand : theme.colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={16}
            color={filterCount > 0 ? theme.colors.brand : theme.colors.text}
          />
          <Text
            style={[
              styles.filterButtonLabel,
              {
                color:
                  filterCount > 0 ? theme.colors.brand : theme.colors.text,
              },
            ]}
          >
            Filter & Sort
          </Text>
          {filterCount > 0 ? (
            <View
              style={[
                styles.filterBadge,
                { backgroundColor: theme.colors.brand },
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  { color: theme.colors.onBrand },
                ]}
              >
                {filterCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {activeFilters.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeChipsRow}
        >
          {activeFilters.map((item) => (
            <FilterChip
              key={item.key}
              label={item.label}
              onRemove={() => setFilters(item.clear)}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            hitSlop={6}
            onPress={() => setFilters(DEFAULT_FILTERS)}
            style={({ pressed }) => [
              styles.clearAll,
              {
                borderColor: theme.colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.clearAllLabel, { color: theme.colors.textSecondary }]}>
              Clear all
            </Text>
          </Pressable>
        </ScrollView>
      ) : null}
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
              message="Try a different search term or clear a filter."
              actionLabel="Reset filters"
              onAction={resetAll}
            />
          }
        />
      )}

      {filtersVisible ? (
        <FilterSheet
          onClose={() => setFiltersVisible(false)}
          filters={filters}
          sort={sort}
          brands={brands}
          presets={presets}
          bounds={bounds}
          countResults={countForFilters}
          onApply={(nextFilters, nextSort) => {
            setFilters(nextFilters);
            setSort(nextSort);
          }}
        />
      ) : null}
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
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[4],
  },
  resultCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  filterButton: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    paddingHorizontal: space[5],
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  filterButtonLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[2],
  },
  filterBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
  },
  activeChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingRight: space[3],
  },
  clearAll: {
    height: 36,
    justifyContent: "center",
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  clearAllLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
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
});
