import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Button from "@/components/Button";
import { IconButton } from "@/components/ui/IconButton";
import { radius, shadows, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useFavoritesStore } from "@/store/favoritesStore";

type MenuItem = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  hint?: string;
};

const shoppingLinks: MenuItem[] = [
  { icon: "package-variant-closed", label: "My orders", hint: "Track and reorder" },
  { icon: "map-marker-outline", label: "Addresses", hint: "2 saved" },
  { icon: "credit-card-outline", label: "Payment methods" },
  { icon: "ticket-percent-outline", label: "Coupons & offers" },
];

const supportLinks: MenuItem[] = [
  { icon: "help-circle-outline", label: "Help center" },
  { icon: "shield-lock-outline", label: "Privacy & security" },
  { icon: "information-outline", label: "About shopcart" },
];

export default function ProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const checkSession = useAuthStore((state) => state.checkSession);
  const favorites = useFavoritesStore((state) => state.ids.length);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const showComingSoon = (label: string) =>
    Toast.show({
      type: "info",
      text1: label,
      text2: "This screen is part of the next build.",
      visibilityTime: 1800,
    });

  const handleSignOut = async () => {
    await logout();
    Toast.show({ type: "success", text1: "Signed out" });
  };

  const initials = user?.email?.slice(0, 1).toUpperCase() ?? "S";

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
              Your account
            </Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
          </View>
          <IconButton
            icon="cog-outline"
            accessibilityLabel="Settings"
            background={theme.colors.surface}
            style={{ borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => showComingSoon("Settings")}
          />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.identityCard,
            {
              backgroundColor: user ? theme.colors.brand : theme.colors.surface,
              borderColor: user ? theme.colors.brand : theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: user
                  ? "rgba(255,255,255,0.18)"
                  : theme.colors.brandSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: user ? theme.colors.onBrand : theme.colors.brand },
              ]}
            >
              {initials}
            </Text>
          </View>
          <View style={styles.identityCopy}>
            <Text
              style={[
                styles.name,
                { color: user ? theme.colors.onBrand : theme.colors.text },
              ]}
            >
              {user ? user.email.split("@")[0] : "Welcome to shopcart"}
            </Text>
            <Text
              style={[
                styles.email,
                {
                  color: user
                    ? "rgba(255,255,255,0.78)"
                    : theme.colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {user
                ? user.email
                : "Sign in to sync carts, orders, and saved items."}
            </Text>
          </View>
          {user ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              onPress={handleSignOut}
              style={styles.signOut}
            >
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color={theme.colors.onBrand}
              />
            </Pressable>
          ) : (
            <Button
              title={isSupabaseConfigured ? "Sign in" : "Preview auth"}
              onPress={() => router.push("/auth")}
              size="small"
              variant="secondary"
            />
          )}
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="package-variant" label="Orders" value="3" />
          <StatCard icon="heart-outline" label="Saved" value={`${favorites}`} />
          <StatCard icon="ticket-percent-outline" label="Coupons" value="2" />
        </View>

        <MenuGroup title="Shopping" items={shoppingLinks} onPress={showComingSoon} />

        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.groupTitle, { color: theme.colors.textMuted }]}>
            PREFERENCES
          </Text>
          <ToggleRow
            icon="bell-outline"
            label="Order updates"
            value={orderUpdates}
            onChange={setOrderUpdates}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <ToggleRow
            icon="sale-outline"
            label="Promotions & deals"
            value={promotions}
            onChange={setPromotions}
          />
        </View>

        <MenuGroup title="Support" items={supportLinks} onPress={showComingSoon} />

        <Text style={[styles.version, { color: theme.colors.textMuted }]}>
          shopcart v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={theme.colors.brand} />
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

function MenuGroup({
  title,
  items,
  onPress,
}: {
  title: string;
  items: MenuItem[];
  onPress: (label: string) => void;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.group,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.groupTitle, { color: theme.colors.textMuted }]}>
        {title.toUpperCase()}
      </Text>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 ? (
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => onPress(item.label)}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.65 : 1 }]}
          >
            <View
              style={[styles.rowIcon, { backgroundColor: theme.colors.surfaceMuted }]}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={18}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                {item.label}
              </Text>
              {item.hint ? (
                <Text style={[styles.rowHint, { color: theme.colors.textMuted }]}>
                  {item.hint}
                </Text>
              ) : null}
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.colors.textMuted}
            />
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.row}>
      <View
        style={[styles.rowIcon, { backgroundColor: theme.colors.surfaceMuted }]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={theme.colors.textSecondary}
        />
      </View>
      <Text style={[styles.rowLabel, styles.toggleLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: theme.colors.surfaceMuted,
          true: theme.colors.brand,
        }}
        thumbColor={theme.colors.surface}
        ios_backgroundColor={theme.colors.surfaceMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space[7],
    paddingTop: space[3],
    paddingBottom: space[4],
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
  content: {
    paddingHorizontal: space[7],
    paddingBottom: space[10] + space[9],
    gap: space[5],
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    padding: space[5],
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 22,
  },
  identityCopy: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
  },
  email: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  signOut: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  statsRow: {
    flexDirection: "row",
    gap: space[4],
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: space[5],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
  },
  statLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
  },
  group: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space[4],
  },
  groupTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    paddingHorizontal: space[3],
    paddingTop: space[2],
    paddingBottom: space[3],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    paddingHorizontal: space[2],
    paddingVertical: space[3],
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    gap: 1,
  },
  rowLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
  },
  rowHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
  },
  toggleLabel: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  version: {
    textAlign: "center",
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    marginTop: space[3],
  },
});
