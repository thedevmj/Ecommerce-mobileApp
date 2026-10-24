import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Button from "@/components/Button";
import CommonHeader from "@/components/CommonHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { radius, shadows, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatPrice } from "@/lib/format";
import { cartSubtotal, useCartStore } from "@/store/cartStore";

type DeliveryKey = "standard" | "express";
type PaymentKey = "card" | "wallet" | "cod";

const deliveryOptions: {
  key: DeliveryKey;
  label: string;
  detail: string;
  price: number;
}[] = [
  { key: "standard", label: "Standard", detail: "3–5 business days", price: 0 },
  { key: "express", label: "Express", detail: "1–2 business days", price: 9.99 },
];

const paymentOptions: {
  key: PaymentKey;
  label: string;
  detail: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  {
    key: "card",
    label: "Card ending 4242",
    detail: "Visa · expires 09/28",
    icon: "credit-card-outline",
  },
  {
    key: "wallet",
    label: "Mobile wallet",
    detail: "Apple Pay / Google Pay",
    icon: "wallet-outline",
  },
  {
    key: "cod",
    label: "Cash on delivery",
    detail: "Pay when it arrives",
    icon: "cash-multiple",
  },
];

export default function CheckoutScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const [delivery, setDelivery] = useState<DeliveryKey>("standard");
  const [payment, setPayment] = useState<PaymentKey>("card");
  const [placed, setPlaced] = useState(false);
  const [orderNumber] = useState(
    () => `SC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  );

  const subtotal = cartSubtotal(items);
  const shipping =
    delivery === "express" ? 9.99 : subtotal >= 50 ? 0 : 4.99;
  const total = subtotal + shipping;

  const placeOrder = () => {
    setPlaced(true);
    clear();
  };

  if (placed) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={styles.success}>
          <View style={[styles.successOrb, { backgroundColor: theme.colors.successSoft }]}>
            <MaterialCommunityIcons
              name="check-bold"
              size={34}
              color={theme.colors.success}
            />
          </View>
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            Order placed
          </Text>
          <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
            Thanks for shopping with us. A confirmation has been sent to your
            inbox.
          </Text>
          <View
            style={[
              styles.orderCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.orderLabel, { color: theme.colors.textMuted }]}>
              Order number
            </Text>
            <Text style={[styles.orderValue, { color: theme.colors.text }]}>
              {orderNumber}
            </Text>
            <Text style={[styles.orderLabel, { color: theme.colors.textMuted }]}>
              Estimated delivery
            </Text>
            <Text style={[styles.orderValue, { color: theme.colors.text }]}>
              {delivery === "express" ? "1–2 business days" : "3–5 business days"}
            </Text>
          </View>
          <Button
            title="Continue shopping"
            onPress={() => router.replace("/(tabs)/shop")}
            fullWidth
          />
          <Button
            title="View orders"
            onPress={() => router.replace("/(tabs)/profile")}
            variant="ghost"
            fullWidth
          />
        </SafeAreaView>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
        <CommonHeader title="Checkout" />
        <EmptyState
          icon="cart-outline"
          title="Nothing to check out"
          message="Your cart is empty. Add a product before continuing."
          actionLabel="Browse products"
          onAction={() => router.replace("/(tabs)/shop")}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <CommonHeader title="Checkout" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 110 + insets.bottom },
        ]}
      >
        <View style={styles.steps}>
          {["Cart", "Details", "Payment"].map((step, index) => (
            <React.Fragment key={step}>
              {index > 0 ? (
                <View style={[styles.stepLine, { backgroundColor: theme.colors.border }]} />
              ) : null}
              <View style={styles.step}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        index <= 1 ? theme.colors.brand : theme.colors.surface,
                      borderColor:
                        index <= 1 ? theme.colors.brand : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      {
                        color:
                          index <= 1
                            ? theme.colors.onBrand
                            : theme.colors.textMuted,
                      },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, { color: theme.colors.textSecondary }]}>
                  {step}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Delivery method
            </Text>
            <MaterialCommunityIcons
              name="truck-fast-outline"
              size={20}
              color={theme.colors.brand}
            />
          </View>
          {deliveryOptions.map((option) => {
            const selected = delivery === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setDelivery(option.key)}
                style={[
                  styles.option,
                  {
                    borderColor: selected
                      ? theme.colors.brand
                      : theme.colors.border,
                    backgroundColor: selected
                      ? theme.colors.brandSoft
                      : "transparent",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={selected ? "radiobox-marked" : "radiobox-blank"}
                  size={20}
                  color={selected ? theme.colors.brand : theme.colors.textMuted}
                />
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                    {option.label}
                  </Text>
                  <Text
                    style={[styles.optionDetail, { color: theme.colors.textMuted }]}
                  >
                    {option.detail}
                  </Text>
                </View>
                <Text style={[styles.optionPrice, { color: theme.colors.text }]}>
                  {option.key === "standard" && subtotal < 50
                    ? formatPrice(4.99)
                    : option.price === 0
                      ? "Free"
                      : formatPrice(option.price)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Ship to
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change delivery address"
              hitSlop={8}
              onPress={() =>
                Toast.show({
                  type: "info",
                  text1: "Address book",
                  text2: "Saved addresses will connect to Supabase.",
                })
              }
            >
              <Text style={[styles.change, { color: theme.colors.brand }]}>
                Change
              </Text>
            </Pressable>
          </View>
          <View style={styles.addressRow}>
            <View
              style={[styles.addressIcon, { backgroundColor: theme.colors.surfaceMuted }]}
            >
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.addressCopy}>
              <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                Alex Morgan
              </Text>
              <Text
                style={[styles.optionDetail, { color: theme.colors.textSecondary }]}
              >
                123 Market Street, San Francisco, CA 94103
              </Text>
              <Text style={[styles.optionDetail, { color: theme.colors.textMuted }]}>
                +1 (415) 555-0132
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Payment
            </Text>
            <MaterialCommunityIcons
              name="lock-outline"
              size={18}
              color={theme.colors.success}
            />
          </View>
          {paymentOptions.map((option) => {
            const selected = payment === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setPayment(option.key)}
                style={[
                  styles.option,
                  {
                    borderColor: selected
                      ? theme.colors.brand
                      : theme.colors.border,
                    backgroundColor: selected
                      ? theme.colors.brandSoft
                      : "transparent",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={20}
                  color={selected ? theme.colors.brand : theme.colors.textMuted}
                />
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                    {option.label}
                  </Text>
                  <Text
                    style={[styles.optionDetail, { color: theme.colors.textMuted }]}
                  >
                    {option.detail}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={selected ? "radiobox-marked" : "radiobox-blank"}
                  size={20}
                  color={selected ? theme.colors.brand : theme.colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Order summary
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Items ({items.length})
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {formatPrice(subtotal)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Shipping
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {shipping === 0 ? "Free" : formatPrice(shipping)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.text }]}>
              {formatPrice(total)}
            </Text>
          </View>
        </View>

        <Text style={[styles.legal, { color: theme.colors.textMuted }]}>
          By placing this order you agree to the shopcart terms and return
          policy.
        </Text>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom + space[4],
          },
        ]}
      >
        <View style={styles.bottomCopy}>
          <Text style={[styles.bottomLabel, { color: theme.colors.textMuted }]}>
            Total
          </Text>
          <Text style={[styles.bottomTotal, { color: theme.colors.text }]}>
            {formatPrice(total)}
          </Text>
        </View>
        <Button
          title="Place order"
          onPress={placeOrder}
          icon="lock-outline"
          style={styles.placeButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space[7],
    gap: space[5],
  },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space[3],
  },
  step: {
    alignItems: "center",
    gap: space[2],
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
  },
  stepLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
  },
  stepLine: {
    flex: 1,
    height: 1,
    marginHorizontal: space[3],
    marginBottom: space[5],
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space[5],
    gap: space[4],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    padding: space[4],
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  optionCopy: {
    flex: 1,
    gap: 1,
  },
  optionLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
  optionDetail: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  optionPrice: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  change: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  addressRow: {
    flexDirection: "row",
    gap: space[4],
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  addressCopy: {
    flex: 1,
    gap: 2,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  totalLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
  },
  totalValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  legal: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: space[5],
    paddingHorizontal: space[7],
    paddingTop: space[4],
    borderTopWidth: 1,
    ...shadows.md,
  },
  bottomCopy: {
    gap: 1,
  },
  bottomLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  bottomTotal: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 19,
  },
  placeButton: {
    flex: 1,
  },
  success: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space[7],
    gap: space[4],
  },
  successOrb: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space[3],
  },
  successTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    letterSpacing: -0.4,
  },
  successText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 300,
    marginBottom: space[3],
  },
  orderCard: {
    alignSelf: "stretch",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space[5],
    gap: space[1],
    marginBottom: space[3],
  },
  orderLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  orderValue: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    marginBottom: space[3],
  },
});
