import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CommonHeader from "@/components/CommonHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatPrice } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  title_snapshot: string;
  image_snapshot: string | null;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  placed_at: string;
  payment_method?: string | null;
  order_items: OrderItem[];
};

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  paid: { bg: "#DBEAFE", text: "#1E40AF" },
  processing: { bg: "#E0E7FF", text: "#312E81" },
  shipped: { bg: "#DCFCE7", text: "#166534" },
  delivered: { bg: "#DCFCE7", text: "#166534" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  refunded: { bg: "#F1F5F9", text: "#475569" },
};

export default function OrdersScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setOrders([]);
      setLoadError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoadError(null);
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            quantity,
            unit_price,
            title_snapshot,
            image_snapshot
          )
        `
        )
        .eq("user_id", user.id)
        .order("placed_at", { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (err: any) {
      console.log("Failed to fetch orders", err);
      setLoadError(err?.message || "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await fetchOrders();
    };
    load();
    return () => {
      mounted = false;
    };
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (!user) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
        <CommonHeader title="My orders" />
        <EmptyState
          icon="account-outline"
          title="Sign in to view orders"
          message="Track your purchases and reorder your favorites."
          actionLabel="Sign in"
          onAction={() => router.push("/auth")}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
        <CommonHeader title="My orders" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
        <CommonHeader title="My orders" />
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load orders"
          message={loadError}
          actionLabel="Try again"
          onAction={() => {
            setLoading(true);
            fetchOrders();
          }}
        />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
        <CommonHeader title="My orders" />
        <EmptyState
          icon="package-variant-closed"
          title="No orders yet"
          message="When you place an order, it will appear here."
          actionLabel="Start shopping"
          onAction={() => router.replace("/(tabs)/shop")}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <CommonHeader title="My orders" />
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand}
          />
        }
        renderItem={({ item }) => {
          const statusStyle = statusColors[item.status] || statusColors.pending;
          const itemCount = item.order_items?.reduce(
            (sum, oi) => sum + oi.quantity,
            0
          ) || 0;

          return (
            <Pressable
              style={[
                styles.orderCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {}}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
                    #{item.order_number}
                  </Text>
                  <Text style={[styles.orderDate, { color: theme.colors.textMuted }]}>
                    {formatDate(item.placed_at)}
                    {" · Cash on delivery"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.itemsPreview}>
                <Text style={[styles.itemsCount, { color: theme.colors.textSecondary }]}>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </Text>
                <Text style={[styles.itemsTotal, { color: theme.colors.text }]}>
                  {formatPrice(item.total)}
                </Text>
              </View>

              <View style={styles.orderItems}>
                {(item.order_items || []).slice(0, 3).map((oi) => (
                  <View key={oi.id} style={styles.orderItemRow}>
                    <View
                      style={[
                        styles.itemImage,
                        { backgroundColor: theme.colors.surfaceMuted },
                      ]}
                    >
                      {oi.image_snapshot ? (
                        <Text style={{ fontSize: 10 }}>📦</Text>
                      ) : (
                        <MaterialCommunityIcons
                          name="image-outline"
                          size={16}
                          color={theme.colors.textMuted}
                        />
                      )}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text
                        style={[styles.itemTitle, { color: theme.colors.text }]}
                        numberOfLines={1}
                      >
                        {oi.title_snapshot}
                      </Text>
                      <Text
                        style={[styles.itemMeta, { color: theme.colors.textMuted }]}
                      >
                        Qty: {oi.quantity} • {formatPrice(oi.unit_price)}
                      </Text>
                    </View>
                  </View>
                ))}
                {(item.order_items?.length || 0) > 3 ? (
                  <Text style={[styles.moreItems, { color: theme.colors.brand }]}>
                    +{(item.order_items?.length || 0) - 3} more items
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: space[7],
    gap: space[4],
  },
  orderCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: space[4],
  },
  orderHeaderLeft: {
    gap: 2,
  },
  orderNumber: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
  },
  orderDate: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.pill,
  },
  statusText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
  },
  divider: {
    height: 1,
  },
  itemsPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space[4],
    paddingTop: space[3],
  },
  itemsCount: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
  },
  itemsTotal: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
  },
  orderItems: {
    padding: space[4],
    gap: space[3],
  },
  orderItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    gap: 1,
  },
  itemTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  itemMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
  },
  moreItems: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    paddingLeft: 52,
  },
});
