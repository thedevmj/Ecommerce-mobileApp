import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { addressLines } from "@/lib/addresses";
import { formatPrice } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { defaultAddress, useAddressStore } from "@/store/addressStore";
import { useAuthStore } from "@/store/authStore";
import { cartSubtotal, useCartStore } from "@/store/cartStore";

type DeliveryKey = "standard" | "express";

const deliveryOptions: {
  key: DeliveryKey;
  label: string;
  detail: string;
  price: number;
}[] = [
  { key: "standard", label: "Standard", detail: "3–5 business days", price: 0 },
  { key: "express", label: "Express", detail: "1–2 business days", price: 9.99 },
];

export default function CheckoutScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const user = useAuthStore((state) => state.user);
  const addresses = useAddressStore((state) => state.addresses);
  const loadAddresses = useAddressStore((state) => state.load);
  const [delivery, setDelivery] = useState<DeliveryKey>("standard");
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState(
    () => `SC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  );
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (user) loadAddresses();
  }, [user, loadAddresses]);

  const selectedAddress = defaultAddress(addresses);

  const subtotal = cartSubtotal(items);
  const shipping =
    delivery === "express" ? 9.99 : subtotal >= 50 ? 0 : 4.99;
  const total = subtotal + shipping;

  const placeOrder = async () => {
    if (items.length === 0) return;

    if (!user) {
      Toast.show({
        type: "info",
        text1: "Sign in required",
        text2: "Please sign in to place your order.",
      });
      router.push("/auth");
      return;
    }

    if (!isSupabaseConfigured) {
      setPlaced(true);
      clear();
      Toast.show({
        type: "success",
        text1: "Order placed (demo)",
        text2: "Connect Supabase to save orders.",
      });
      return;
    }

    setPlacing(true);
    try {
      let address = selectedAddress;
      if (!address) {
        await loadAddresses(true);
        address = defaultAddress(useAddressStore.getState().addresses);
      }

      if (!address) {
        Toast.show({
          type: "info",
          text1: "Add a delivery address",
          text2: "Save where you want your order delivered.",
        });
        router.push("/addresses");
        return;
      }

      const shippingAddress = {
        label: address.label,
        recipient: address.recipient,
        line1: address.line1,
        line2: address.line2 ?? undefined,
        city: address.city,
        state: address.state ?? undefined,
        postal_code: address.postalCode,
        country: address.country,
        phone: address.phone ?? undefined,
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          subtotal,
          discount: 0,
          shipping,
          tax: 0,
          total,
          shipping_address: shippingAddress,
          status: "pending",
        })
        .select("id, order_number")
        .single();

      if (orderError) throw orderError;
      if (order?.order_number) setOrderNumber(order.order_number);

      const orderItemsPayload = items.map((item) => ({
        order_id: order.id,
        product_id: typeof item.product.id === "string" ? item.product.id : null,
        title_snapshot: item.product.title,
        image_snapshot: item.product.image,
        unit_price: item.product.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsPayload);

      if (itemsError) throw itemsError;

      setPlaced(true);
      clear();
    } catch (error: any) {
      console.log("Checkout error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to place order",
        text2: error?.message || error?.details || "Please try again.",
      });
    } finally {
      setPlacing(false);
    }
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
            <Text style={[styles.orderLabel, { color: theme.colors.textMuted }]}>
              Payment
            </Text>
            <Text style={[styles.orderValue, { color: theme.colors.text }]}>
              Cash on delivery
            </Text>
          </View>
          <Button
            title="Continue shopping"
            onPress={() => router.replace("/(tabs)/shop")}
            fullWidth
          />
          <Button
            title="View orders"
            onPress={() => router.replace("/orders")}
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
          {["Cart", "Details", "Confirm"].map((step, index) => (
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
              accessibilityLabel={
                selectedAddress ? "Change delivery address" : "Add delivery address"
              }
              hitSlop={8}
              onPress={() => router.push(user ? "/addresses" : "/auth")}
            >
              <Text style={[styles.change, { color: theme.colors.brand }]}>
                {user ? (selectedAddress ? "Change" : "Add") : "Sign in"}
              </Text>
            </Pressable>
          </View>
          {selectedAddress ? (
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
                  {selectedAddress.recipient}
                </Text>
                {addressLines(selectedAddress).map((line, index) => (
                  <Text
                    key={`${index}-${line}`}
                    style={[
                      styles.optionDetail,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {line}
                  </Text>
                ))}
                {selectedAddress.phone ? (
                  <Text
                    style={[
                      styles.optionDetail,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {selectedAddress.phone}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a delivery address"
              onPress={() => router.push(user ? "/addresses" : "/auth")}
              style={({ pressed }) => [
                styles.emptyAddress,
                {
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View
                style={[styles.addressIcon, { backgroundColor: theme.colors.brandSoft }]}
              >
                <MaterialCommunityIcons
                  name="map-marker-plus-outline"
                  size={20}
                  color={theme.colors.brand}
                />
              </View>
              <View style={styles.addressCopy}>
                <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                  {user ? "Add a delivery address" : "Sign in to add an address"}
                </Text>
                <Text
                  style={[
                    styles.optionDetail,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {user
                    ? "Save an address for faster checkout."
                    : "Your saved addresses will appear here."}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.colors.textMuted}
              />
            </Pressable>
          )}
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
              name="cash-multiple"
              size={20}
              color={theme.colors.success}
            />
          </View>
          <View
            style={[
              styles.option,
              {
                borderColor: theme.colors.brand,
                backgroundColor: theme.colors.brandSoft,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="cash-multiple"
              size={20}
              color={theme.colors.brand}
            />
            <View style={styles.optionCopy}>
              <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                Cash on delivery
              </Text>
              <Text
                style={[styles.optionDetail, { color: theme.colors.textMuted }]}
              >
                Pay the courier in cash when your order arrives.
              </Text>
            </View>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={theme.colors.brand}
            />
          </View>
          <Text style={[styles.optionDetail, { color: theme.colors.textMuted }]}>
            Online card and wallet payments are not available. No payment is
            taken until delivery.
          </Text>
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
          title={placing ? "Placing order..." : "Place COD order"}
          onPress={placeOrder}
          icon={placing ? undefined : "check-circle-outline"}
          disabled={placing}
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
  emptyAddress: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    padding: space[4],
    borderRadius: radius.sm,
    borderWidth: 1,
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
