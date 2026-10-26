import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router/js-tabs";
import React, { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/HapticTab";
import { radius, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { cartCount, useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export default function TabLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const count = useCartStore((state) => cartCount(state.items));
  const user = useAuthStore((state) => state.user);
  const syncFromLocalToSupabase = useCartStore((state) => state.syncFromLocalToSupabase);

  useEffect(() => {
    if (user?.id) {
      syncFromLocalToSupabase(user.id);
    }
  }, [user?.id, syncFromLocalToSupabase]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarButton: HapticTab,
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: 11,
        },
        tabBarBadgeStyle: {
          backgroundColor: theme.colors.accent,
          color: theme.colors.onAccent,
          fontFamily: typography.fontFamily.bold,
          fontSize: 9,
          minWidth: 17,
          height: 17,
          lineHeight: 16,
          borderRadius: radius.pill,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-variant-outline"
              size={size}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="storefront-outline"
              size={size}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge: count > 0 ? (count > 9 ? "9+" : count) : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="cart-outline"
              size={size}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-outline"
              size={size}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
    </Tabs>
  );
}
