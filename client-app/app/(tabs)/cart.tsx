import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Button from "@/components/Button";
import CommonHeader from "@/components/CommonHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { radius, shadows, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatCategory, formatPrice } from "@/lib/format";
import { cartCount, cartSubtotal, useCartStore } from "@/store/cartStore";

const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_FEE = 4.99;

export default function CartScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);

  const count = cartCount(items);
  const subtotal = cartSubtotal(items);
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const shipping =
    subtotal - discount >= FREE_SHIPPING_THRESHOLD || items.length === 0
      ? 0
      : SHIPPING_FEE;
  const total = subtotal - discount + shipping;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - (subtotal - discount));
  const progress = Math.min(1, (subtotal - discount) / FREE_SHIPPING_THRESHOLD);

  const handlePromo = () => {
    if (!promo.trim()) return;
    if (promo.trim().toUpperCase() === "SHOP10") {
      setPromoApplied(true);
      Toast.show({ type: "success", text1: "Promo applied", text2: "10% off your order" });
    } else {
      Toast.show({ type: "error", text1: "Invalid code", text2: "Try SHOP10" });
    }
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <CommonHeader title="Your cart" />

      {items.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Add a few favorites and they will show up here, ready for checkout."
          actionLabel="Start shopping"
          onAction={() => router.push("/(tabs)/shop")}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.itemCount, { color: theme.colors.textMuted }]}>
                {count} {count === 1 ? "item" : "items"}
              </Text>
              <Pressable accessibilityRole="button" onPress={clear} hitSlop={8}>
                <Text style={[styles.clear, { color: theme.colors.error }]}>
                  Clear cart
                </Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.shippingCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.shippingTop}>
                <MaterialCommunityIcons
                  name={remaining === 0 ? "truck-check-outline" : "truck-fast-outline"}
                  size={18}
                  color={theme.colors.brand}
                />
                <Text
                  style={[styles.shippingText, { color: theme.colors.textSecondary }]}
                >
                  {remaining === 0
                    ? "You unlocked free shipping."
                    : `Add ${formatPrice(remaining)} more for free shipping.`}
                </Text>
              </View>
              <View
                style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceMuted }]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: theme.colors.brand,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.items}>
              {items.map(({ product, quantity }) => (
                <View
                  key={product.id}
                  style={[
                    styles.item,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View ${product.title}`}
                    onPress={() => router.push(`/product/${product.id}`)}
                    style={[
                      styles.imageWell,
                      { backgroundColor: theme.colors.surfaceMuted },
                    ]}
                  >
                    <Image
                      source={{ uri: product.image }}
                      style={styles.image}
                      resizeMode="contain"
                    />
                  </Pressable>
                  <View style={styles.itemContent}>
                    <View style={styles.itemTop}>
                      <View style={styles.itemCopy}>
                        <Text
                          style={[styles.category, { color: theme.colors.textMuted }]}
                          numberOfLines={1}
                        >
                          {formatCategory(product.category)}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={[styles.title, { color: theme.colors.text }]}
                        >
                          {product.title}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${product.title}`}
                        hitSlop={8}
                        onPress={() => removeItem(product.id)}
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={19}
                          color={theme.colors.textMuted}
                        />
                      </Pressable>
                    </View>
                    <View style={styles.itemBottom}>
                      <QuantityStepper
                        value={quantity}
                        onChange={(value) => setQuantity(product.id, value)}
                        compact
                      />
                      <Text style={[styles.price, { color: theme.colors.text }]}>
                        {formatPrice(product.price * quantity)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.promoCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Promo code
              </Text>
              <View style={styles.promoRow}>
                <TextInput
                  value={promo}
                  onChangeText={setPromo}
                  placeholder="Try SHOP10"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="characters"
                  editable={!promoApplied}
                  style={[
                    styles.promoInput,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surfaceMuted,
                      color: theme.colors.text,
                    },
                  ]}
                />
                <Button
                  title={promoApplied ? "Applied" : "Apply"}
                  onPress={handlePromo}
                  variant="outline"
                  size="small"
                  disabled={promoApplied}
                />
              </View>
            </View>

            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Order summary
              </Text>
              <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
              {discount > 0 ? (
                <SummaryRow
                  label="Promo discount"
                  value={`-${formatPrice(discount)}`}
                  tone="success"
                />
              ) : null}
              <SummaryRow
                label="Shipping"
                value={shipping === 0 ? "Free" : formatPrice(shipping)}
                tone={shipping === 0 ? "success" : "default"}
              />
              <View
                style={[styles.divider, { backgroundColor: theme.colors.border }]}
              />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
                  Total
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                  {formatPrice(total)}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.checkoutBar,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.checkoutCopy}>
              <Text style={[styles.checkoutLabel, { color: theme.colors.textMuted }]}>
                Total
              </Text>
              <Text style={[styles.checkoutTotal, { color: theme.colors.text }]}>
                {formatPrice(total)}
              </Text>
            </View>
            <Button
              title="Checkout"
              onPress={handleCheckout}
              icon="lock-outline"
              style={styles.checkoutButton}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function SummaryRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success";
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.summaryValue,
          {
            color: tone === "success" ? theme.colors.success : theme.colors.text,
          },
        ]}
      >
        {value}
      </Text>
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
  scrollContent: {
    paddingHorizontal: space[7],
    paddingBottom: space[8],
    gap: space[5],
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  clear: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  shippingCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space[5],
    gap: space[4],
  },
  shippingTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  shippingText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  items: {
    gap: space[4],
  },
  item: {
    flexDirection: "row",
    gap: space[4],
    padding: space[4],
    borderRadius: radius.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  imageWell: {
    width: 88,
    height: 88,
    borderRadius: radius.sm,
    padding: space[3],
  },
  image: {
    width: "100%",
    height: "100%",
  },
  itemContent: {
    flex: 1,
    justifyContent: "space-between",
    gap: space[3],
  },
  itemTop: {
    flexDirection: "row",
    gap: space[3],
  },
  itemCopy: {
    flex: 1,
    gap: 1,
  },
  category: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  itemBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
  },
  promoCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space[5],
    gap: space[4],
  },
  promoRow: {
    flexDirection: "row",
    gap: space[3],
  },
  promoInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space[4],
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
  },
  summaryCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space[5],
    gap: space[4],
  },
  cardTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
  summaryLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
  },
  summaryValue: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
  divider: {
    height: 1,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
  },
  totalValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  checkoutBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[5],
    paddingHorizontal: space[7],
    paddingVertical: space[4],
    borderTopWidth: 1,
  },
  checkoutCopy: {
    gap: 1,
  },
  checkoutLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  checkoutTotal: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 19,
    letterSpacing: -0.3,
  },
  checkoutButton: {
    flex: 1,
  },
});
