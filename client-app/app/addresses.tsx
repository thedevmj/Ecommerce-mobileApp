import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Button from "@/components/Button";
import CommonHeader from "@/components/CommonHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { radius, shadows, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Address, addressLines } from "@/lib/addresses";
import { useAddressStore } from "@/store/addressStore";
import { useAuthStore } from "@/store/authStore";

export default function AddressesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const addresses = useAddressStore((state) => state.addresses);
  const loading = useAddressStore((state) => state.loading);
  const loaded = useAddressStore((state) => state.loaded);
  const error = useAddressStore((state) => state.error);
  const load = useAddressStore((state) => state.load);
  const remove = useAddressStore((state) => state.remove);
  const makeDefault = useAddressStore((state) => state.makeDefault);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const openForm = (address?: Address) => {
    router.push(
      address ? { pathname: "/address-form", params: { id: address.id } } : "/address-form"
    );
  };

  const handleMakeDefault = async (address: Address) => {
    if (busyId) return;
    setBusyId(address.id);
    try {
      await makeDefault(address.id);
      Toast.show({ type: "success", text1: "Default address updated" });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Could not update default",
        text2: err?.message || "Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (address: Address) => {
    Alert.alert(
      "Delete address?",
      `${address.label} will be removed from your address book.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setBusyId(address.id);
            try {
              await remove(address.id);
              Toast.show({ type: "success", text1: "Address deleted" });
            } catch (err: any) {
              Toast.show({
                type: "error",
                text1: "Could not delete address",
                text2: err?.message || "Please try again.",
              });
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const showSkeleton = Boolean(user) && loading && !loaded;

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <CommonHeader title="Addresses" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {!user ? (
          <EmptyState
            icon="map-marker-off-outline"
            title="Sign in to save addresses"
            message="Add delivery details once and reuse them at checkout."
            actionLabel="Sign in"
            onAction={() => router.push("/auth")}
          />
        ) : showSkeleton ? (
          <View style={styles.skeletonWrap}>
            {[0, 1].map((item) => (
              <View
                key={item}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Skeleton width="40%" height={16} />
                <Skeleton width="70%" height={12} />
                <Skeleton width="55%" height={12} />
              </View>
            ))}
          </View>
        ) : error && addresses.length === 0 ? (
          <View style={styles.errorWrap}>
            <EmptyState
              icon="cloud-alert-outline"
              title="Could not load addresses"
              message={error}
              actionLabel="Try again"
              onAction={() => load(true)}
            />
          </View>
        ) : addresses.length === 0 ? (
          <EmptyState
            icon="map-marker-plus-outline"
            title="No addresses yet"
            message="Add a delivery address to speed up checkout."
            actionLabel="Add address"
            onAction={() => openForm()}
          />
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: theme.colors.textMuted }]}>
                {addresses.length} SAVED
              </Text>
              <Button
                title="Add"
                icon="plus"
                size="small"
                variant="outline"
                onPress={() => openForm()}
              />
            </View>

            {addresses.map((address) => {
              const busy = busyId === address.id;
              return (
                <View
                  key={address.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: address.isDefault
                        ? theme.colors.brand
                        : theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.labelRow}>
                      <View
                        style={[
                          styles.iconOrb,
                          {
                            backgroundColor: address.isDefault
                              ? theme.colors.brandSoft
                              : theme.colors.surfaceMuted,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            address.label.toLowerCase() === "work"
                              ? "briefcase-outline"
                              : "home-outline"
                          }
                          size={18}
                          color={
                            address.isDefault
                              ? theme.colors.brand
                              : theme.colors.textSecondary
                          }
                        />
                      </View>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        {address.label}
                      </Text>
                      {address.isDefault ? <Badge label="Default" /> : null}
                    </View>
                    <View style={styles.headerActions}>
                      <IconButton
                        icon="pencil-outline"
                        accessibilityLabel={`Edit ${address.label} address`}
                        onPress={() => openForm(address)}
                        background={theme.colors.surfaceMuted}
                      />
                      <IconButton
                        icon="trash-can-outline"
                        accessibilityLabel={`Delete ${address.label} address`}
                        onPress={() => handleDelete(address)}
                        background={theme.colors.errorSoft}
                        color={theme.colors.error}
                      />
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text
                      style={[styles.recipient, { color: theme.colors.text }]}
                    >
                      {address.recipient}
                    </Text>
                    {addressLines(address).map((line, index) => (
                      <Text
                        key={`${index}-${line}`}
                        style={[
                          styles.line,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {line}
                      </Text>
                    ))}
                    {address.phone ? (
                      <Text
                        style={[styles.phone, { color: theme.colors.textMuted }]}
                      >
                        {address.phone}
                      </Text>
                    ) : null}
                  </View>

                  {address.isDefault ? (
                    <View style={styles.defaultRow}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={16}
                        color={theme.colors.success}
                      />
                      <Text
                        style={[
                          styles.defaultText,
                          { color: theme.colors.success },
                        ]}
                      >
                        Used at checkout
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Set ${address.label} as default address`}
                      accessibilityState={{ disabled: busy, busy }}
                      disabled={busy}
                      onPress={() => handleMakeDefault(address)}
                      style={({ pressed }) => [
                        styles.defaultButton,
                        {
                          borderColor: theme.colors.border,
                          opacity: busy ? 0.6 : pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color={theme.colors.brand} />
                      ) : (
                        <MaterialCommunityIcons
                          name="check-circle-outline"
                          size={16}
                          color={theme.colors.brand}
                        />
                      )}
                      <Text
                        style={[
                          styles.defaultButtonText,
                          { color: theme.colors.brand },
                        ]}
                      >
                        Set as default
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}

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
                name="information-outline"
                size={18}
                color={theme.colors.brand}
              />
              <Text
                style={[styles.tipText, { color: theme.colors.textSecondary }]}
              >
                Your default address is used for new orders. You can still
                change it any time.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space[7],
    paddingBottom: space[10],
    gap: space[4],
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: space[2],
  },
  listTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  skeletonWrap: {
    gap: space[4],
  },
  errorWrap: {
    paddingTop: space[6],
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space[5],
    gap: space[4],
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[3],
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    flex: 1,
  },
  iconOrb: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
  headerActions: {
    flexDirection: "row",
    gap: space[2],
  },
  cardBody: {
    gap: 2,
  },
  recipient: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    marginBottom: 2,
  },
  line: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  phone: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    marginTop: space[2],
  },
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  defaultText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  defaultButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[2],
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  defaultButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    padding: space[4],
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
  },
});
