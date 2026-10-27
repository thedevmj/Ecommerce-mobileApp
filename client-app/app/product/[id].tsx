import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Button from "@/components/Button";
import CommonHeader from "@/components/CommonHeader";
import ProductCard from "@/components/ProductCard";
import ProductReviews from "@/components/ProductReviews";
import { Badge } from "@/components/ui/Badge";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Rating } from "@/components/ui/Rating";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { radius, shadows, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { getProduct } from "@/lib/api";
import { formatCategory, formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useProductsStore } from "@/store/productStore";
import { Product } from "@/type";

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const galleryWidth = width - space[7] * 2 - 2;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const galleryRef = useRef<FlatList<string>>(null);

  const addItem = useCartStore((state) => state.addItem);
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const allProducts = useProductsStore((state) => state.products);
  const fetchProducts = useProductsStore((state) => state.fetchProducts);

  const isFavorite = product ? favoriteIds.includes(product.id) : false;

  const refreshProduct = useCallback(() => {
    getProduct(String(id))
      .then((fresh) => setProduct(fresh))
      .catch(() => undefined);
  }, [id]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProduct(id as string);
        if (active) setProduct(data);
      } catch {
        if (active) setError("We couldn't load this product. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    if (allProducts.length === 0) fetchProducts();

    return () => {
      active = false;
    };
  }, [id, allProducts.length, fetchProducts]);

  const images = useMemo(() => {
    if (!product) return [];
    const list = product.images?.length ? product.images : [product.image];
    return Array.from(new Set(list.filter(Boolean)));
  }, [product]);

  const related = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter(
        (item) => item.category === product.category && item.id !== product.id
      )
      .slice(0, 8);
  }, [allProducts, product]);

  const handleAddToCart = (goToCart = false) => {
    if (!product) return;
    addItem(product, quantity);
    if (goToCart) {
      router.push("/(tabs)/cart");
      return;
    }
    Toast.show({
      type: "success",
      text1: "Added to cart",
      text2: `${quantity} × ${product.title}`,
      visibilityTime: 1800,
    });
  };

  if (loading) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
        <CommonHeader />
        <View style={styles.skeletonContent}>
          <Skeleton height={galleryWidth} style={styles.skeletonImage} />
          <Skeleton width="30%" height={14} />
          <Skeleton width="80%" height={26} />
          <Skeleton width="45%" height={20} />
          <Skeleton height={82} />
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
        <CommonHeader />
        <View style={styles.errorState}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={36}
            color={theme.colors.textMuted}
          />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Product unavailable
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error ?? "This product may have been removed."}
          </Text>
          <Button
            title="Back to shop"
            onPress={() => router.replace("/(tabs)/shop")}
            variant="outline"
          />
        </View>
      </View>
    );
  }

  const stock = product.stock ?? 0;
  const inStock = stock > 0;
  const isLowStock = inStock && stock <= 10;
  const stockLabel = inStock
    ? isLowStock
      ? `Only ${stock} left`
      : "In stock"
    : "Sold out";
  const stockTone = inStock ? (isLowStock ? "low" : "stock") : "out";
  const orderedTotal = product.price * quantity;

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <CommonHeader
        title="Product details"
        showFavorite
        isFav={isFavorite}
        handleToggleFavorite={() => toggleFavorite(product.id)}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 110 + insets.bottom },
          ]}
        >
        <View
          style={[
            styles.gallery,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <FlatList
            ref={galleryRef}
            data={images}
            keyExtractor={(item, index) => `${item}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(
              event: NativeSyntheticEvent<NativeScrollEvent>
            ) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / galleryWidth
              );
              setImageIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={[styles.imageSlide, { width: galleryWidth }]}>
                <Image
                  source={{ uri: item }}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />
          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === imageIndex
                          ? theme.colors.brand
                          : theme.colors.borderStrong,
                      width: index === imageIndex ? 18 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          ) : null}
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <View style={[styles.saleTag, { backgroundColor: theme.colors.accent }]}>
              <Text style={[styles.saleText, { color: theme.colors.onAccent }]}>
                Save {Math.round((1 - product.price / product.compareAtPrice) * 100)}%
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.mainInfo}>
          <View style={styles.metaRow}>
            <Text style={[styles.category, { color: theme.colors.brand }]}>
              {formatCategory(product.category)}
            </Text>
            {product.brand ? (
              <Text style={[styles.brand, { color: theme.colors.textMuted }]}>
                by {product.brand}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {product.title}
          </Text>
          <View style={styles.ratingRow}>
            <Rating rate={product.rating.rate} count={product.rating.count} size={15} />
            <View style={styles.metaDot} />
            <Badge label={stockLabel} tone={stockTone} />
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.colors.text }]}>
              {formatPrice(product.price)}
            </Text>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <Text style={[styles.compare, { color: theme.colors.textMuted }]}>
                {formatPrice(product.compareAtPrice)}
              </Text>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.perks,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {[
            { icon: "truck-fast-outline", label: "Free over $50" },
            { icon: "backup-restore", label: "30-day returns" },
            { icon: "shield-check-outline", label: "Secure checkout" },
          ].map((perk, index) => (
            <React.Fragment key={perk.label}>
              {index > 0 ? (
                <View
                  style={[styles.perkDivider, { backgroundColor: theme.colors.border }]}
                />
              ) : null}
              <View style={styles.perk}>
                <MaterialCommunityIcons
                  name={perk.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={18}
                  color={theme.colors.brand}
                />
                <Text style={[styles.perkText, { color: theme.colors.textSecondary }]}>
                  {perk.label}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Description" />
          <Text
            style={[styles.description, { color: theme.colors.textSecondary }]}
            numberOfLines={expanded ? undefined : 4}
          >
            {product.description}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setExpanded((value) => !value)}
          >
            <Text style={[styles.readMore, { color: theme.colors.brand }]}>
              {expanded ? "Show less" : "Read more"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Quantity" />
          <View style={styles.quantityRow}>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.max(1, stock)}
            />
            <Text style={[styles.quantityHint, { color: theme.colors.textMuted }]}>
              {formatPrice(orderedTotal)} total
            </Text>
          </View>
        </View>

        <ProductReviews
          productId={product.id}
          onReviewSubmitted={refreshProduct}
        />

        {related.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="You may also like"
              actionLabel="See all"
              onAction={() =>
                router.push({
                  pathname: "/(tabs)/shop",
                  params: { category: product.category },
                })
              }
            />
            <FlatList
              data={related}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedRow}
              renderItem={({ item }) => <ProductCard product={item} compact />}
            />
          </View>
        ) : null}
        </ScrollView>

        <SafeAreaView
          edges={["bottom"]}
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.bottomCopy}>
          <Text style={[styles.bottomLabel, { color: theme.colors.textMuted }]}>
            {quantity} {quantity === 1 ? "item" : "items"}
          </Text>
          <Text style={[styles.bottomPrice, { color: theme.colors.text }]}>
            {formatPrice(orderedTotal)}
          </Text>
        </View>
        <Button
          title={inStock ? "Add to cart" : "Sold out"}
          onPress={() => handleAddToCart(false)}
          icon="cart-plus"
          disabled={!inStock}
          style={styles.addButton}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buy now"
          disabled={!inStock}
          onPress={() => handleAddToCart(true)}
          style={({ pressed }) => [
            styles.buyButton,
            {
              backgroundColor: theme.colors.text,
              opacity: !inStock ? 0.4 : pressed ? 0.8 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="flash-outline"
            size={20}
            color={theme.colors.textInverse}
          />
        </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space[7],
    gap: space[6],
  },
  gallery: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageSlide: {
    aspectRatio: 1,
    padding: space[7],
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: space[2],
    paddingBottom: space[4],
  },
  dot: {
    height: 6,
    borderRadius: radius.pill,
  },
  saleTag: {
    position: "absolute",
    top: space[5],
    left: space[5],
    paddingHorizontal: space[5],
    paddingVertical: space[2],
    borderRadius: radius.xs,
  },
  saleText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
  },
  mainInfo: {
    gap: space[3],
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  category: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  brand: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: "#CBD5E1",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: space[3],
    marginTop: space[1],
  },
  price: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    letterSpacing: -0.8,
  },
  compare: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    textDecorationLine: "line-through",
  },
  perks: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: space[4],
  },
  perk: {
    flex: 1,
    alignItems: "center",
    gap: space[2],
  },
  perkDivider: {
    width: 1,
    height: 28,
  },
  perkText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
  },
  section: {
    gap: space[4],
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  readMore: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityHint: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  relatedRow: {
    paddingRight: space[2],
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    paddingHorizontal: space[7],
    paddingTop: space[4],
    borderTopWidth: 1,
    ...shadows.md,
  },
  bottomCopy: {
    gap: 1,
    minWidth: 72,
  },
  bottomLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  bottomPrice: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  addButton: {
    flex: 1,
  },
  buyButton: {
    width: 48,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonContent: {
    padding: space[7],
    gap: space[5],
  },
  skeletonImage: {
    borderRadius: radius.lg,
  },
  errorState: {
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
  },
});
