import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatCategory } from "@/lib/format";
import { useProductsStore } from "@/store/productStore";

const trending = [
  "smartphones",
  "womens-dresses",
  "mens-watches",
  "skin-care",
  "sunglasses",
  "fragrances",
];

export default function SearchScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { products, categories, fetchProducts, fetchCategories } =
    useProductsStore();

  useEffect(() => {
    if (products.length === 0) fetchProducts();
    if (categories.length === 0) fetchCategories();
  }, [products.length, categories.length, fetchProducts, fetchCategories]);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (search.length < 2) return [];

    return products.filter((product) => {
      return (
        product.title.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        (product.brand ?? "").toLowerCase().includes(search)
      );
    });
  }, [products, query]);

  const searchActive = query.trim().length >= 2;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.push("/");
  };

  const listHeader = (
    <View style={styles.headerArea}>
      <View style={styles.searchRow}>
        <IconButton
          icon="arrow-left"
          accessibilityLabel="Go back"
          background={theme.colors.surface}
          style={{ borderWidth: 1, borderColor: theme.colors.border }}
          onPress={handleBack}
        />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          autoFocus
          style={styles.searchInput}
        />
      </View>

      {!searchActive ? (
        <View style={styles.suggestions}>
          <View style={styles.suggestionBlock}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              Trending now
            </Text>
            <View style={styles.trendingRow}>
              {trending.map((term) => (
                <Pressable
                  key={term}
                  accessibilityRole="button"
                  onPress={() => setQuery(term)}
                  style={({ pressed }) => [
                    styles.trendingItem,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="trending-up"
                    size={14}
                    color={theme.colors.accent}
                  />
                  <Text
                    style={[styles.trendingText, { color: theme.colors.text }]}
                  >
                    {formatCategory(term)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.suggestionBlock}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              Browse categories
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={formatCategory(category)}
                  onPress={() => setQuery(category)}
                />
              ))}
            </ScrollView>
          </View>

          <View
            style={[
              styles.tip,
              {
                backgroundColor: theme.colors.brandSoft,
                borderColor: theme.colors.brand,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={20}
              color={theme.colors.brand}
            />
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              Search by product, brand, or category. Results update as you type.
            </Text>
          </View>
        </View>
      ) : (
        <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>
          {results.length} {results.length === 1 ? "result" : "results"} for{" "}
          {`"${query.trim()}"`}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={searchActive ? results : []}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={listHeader}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ProductCard product={item} />
          </View>
        )}
        ListEmptyComponent={
          searchActive ? (
            <EmptyState
              icon="magnify-close"
              title="No products match"
              message="Check the spelling or try a broader keyword."
              actionLabel="Clear search"
              onAction={() => setQuery("")}
            />
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space[7],
    paddingBottom: space[10] + space[9],
  },
  headerArea: {
    paddingTop: space[4],
    paddingBottom: space[6],
    gap: space[7],
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
  },
  searchInput: {
    flex: 1,
  },
  suggestions: {
    gap: space[8],
  },
  suggestionBlock: {
    gap: space[4],
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  trendingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[3],
  },
  trendingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  trendingText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  chipsRow: {
    gap: space[3],
    paddingRight: space[3],
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    padding: space[5],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  resultLabel: {
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
});
