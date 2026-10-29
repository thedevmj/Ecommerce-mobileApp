import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Toast from "react-native-toast-message";
import { radius, shadows, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatCategory } from "@/lib/format";
import { useCartStore } from "@/store/cartStore";
import { isFavoriteId, useFavoritesStore } from "@/store/favoritesStore";
import { Product } from "@/type";
import { Price } from "@/components/ui/Price";
import { Rating } from "@/components/ui/Rating";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  customStyle?: StyleProp<ViewStyle>;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  compact = false,
  customStyle,
}) => {
  const { id, title, price, image, category, rating, compareAtPrice } = product;
  const router = useRouter();
  const theme = useAppTheme();
  const addItem = useCartStore((state) => state.addItem);
  const isFavorite = useFavoritesStore((state) =>
    isFavoriteId(state.ids, id)
  );
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  const handleAddToCart = (event: GestureResponderEvent) => {
    event.stopPropagation();
    addItem(product);
    Toast.show({
      type: "success",
      text1: "Added to cart",
      text2: title,
      visibilityTime: 1800,
    });
  };

  const handleToggleFavorite = async (event: GestureResponderEvent) => {
    event.stopPropagation();
    const result = await toggleFavorite(id);

    if (result.error) {
      Toast.show({
        type: "error",
        text1: "Could not update favorites",
        text2: result.error,
        visibilityTime: 2200,
      });
      return;
    }

    Toast.show({
      type: "success",
      text1: result.favorite ? "Saved to favorites" : "Removed from favorites",
      text2: title,
      visibilityTime: 1500,
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatCategory(category)}`}
      onPress={() => router.push(`/product/${id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          width: compact ? 158 : "100%",
          opacity: pressed ? 0.9 : 1,
        },
        compact && styles.compactCard,
        customStyle,
      ]}
    >
      <View
        style={[
          styles.imageWell,
          { backgroundColor: theme.colors.surfaceMuted },
        ]}
      >
        <Image
          source={{ uri: image }}
          style={styles.image}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={150}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite ? `Remove ${title} from favorites` : `Save ${title}`
          }
          accessibilityState={{ selected: isFavorite }}
          hitSlop={6}
          onPress={handleToggleFavorite}
          style={[
            styles.favorite,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={isFavorite ? "heart" : "heart-outline"}
            size={18}
            color={isFavorite ? theme.colors.error : theme.colors.textSecondary}
          />
        </Pressable>
        {compareAtPrice && compareAtPrice > price ? (
          <View style={[styles.sale, { backgroundColor: theme.colors.accent }]}>
            <Text style={[styles.saleText, { color: theme.colors.onAccent }]}>
              {Math.round((1 - price / compareAtPrice) * 100)}% off
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={[styles.content, { padding: compact ? space[4] : space[5] }]}
      >
        <Text
          style={[styles.category, { color: theme.colors.textMuted }]}
          numberOfLines={1}
        >
          {formatCategory(category)}
        </Text>
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={compact ? 1 : 2}
        >
          {title}
        </Text>

        {!compact ? (
          <View style={styles.ratingRow}>
            <Rating rate={rating.rate} count={rating.count} />
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.priceWrap}>
            <Price price={price} compareAtPrice={compact ? undefined : compareAtPrice} size={compact ? "small" : "medium"} />
          </View>
          {!compact ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add ${title} to cart`}
              hitSlop={6}
              onPress={handleAddToCart}
              style={({ pressed }) => [
                styles.addButton,
                {
                  backgroundColor: theme.colors.brand,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="plus"
                size={18}
                color={theme.colors.onBrand}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

export default React.memo(ProductCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.sm,
  },
  compactCard: {
    marginRight: space[5],
  },
  imageWell: {
    width: "100%",
    aspectRatio: 1,
    padding: space[5],
  },
  image: {
    width: "100%",
    height: "100%",
  },
  favorite: {
    position: "absolute",
    top: space[4],
    right: space[4],
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sale: {
    position: "absolute",
    left: space[4],
    bottom: space[4],
    paddingHorizontal: space[4],
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  saleText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
  },
  content: {
    gap: space[1],
  },
  category: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 19,
  },
  ratingRow: {
    marginTop: space[1],
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space[3],
    gap: space[3],
  },
  priceWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: space[2],
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
