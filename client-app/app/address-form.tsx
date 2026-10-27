import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Button from "@/components/Button";
import CommonHeader from "@/components/CommonHeader";
import { Chip } from "@/components/ui/Chip";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  AddressErrors,
  AddressInput,
  emptyAddress,
  fetchAddress,
  toAddressInput,
  validateAddress,
} from "@/lib/addresses";
import { useAddressStore } from "@/store/addressStore";

const labelPresets = ["Home", "Work", "Other"];

export default function AddressFormScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;
  const storeAddress = useAddressStore((state) =>
    id ? state.addresses.find((address) => address.id === id) : undefined
  );
  const addressCount = useAddressStore((state) => state.addresses.length);
  const create = useAddressStore((state) => state.create);
  const update = useAddressStore((state) => state.update);

  const [form, setForm] = useState<AddressInput>(() =>
    storeAddress ? toAddressInput(storeAddress) : emptyAddress()
  );
  const [errors, setErrors] = useState<AddressErrors>({});
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(() => Boolean(id) && !storeAddress);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || storeAddress) return;
    let active = true;

    fetchAddress(id)
      .then((address) => {
        if (!active) return;
        if (address) {
          setForm(toAddressInput(address));
        } else {
          setFetchError("This address could not be found.");
        }
        setFetching(false);
      })
      .catch((error: any) => {
        if (!active) return;
        setFetchError(error?.message || "Could not load this address.");
        setFetching(false);
      });

    return () => {
      active = false;
    };
  }, [id, storeAddress]);

  const setField = <K extends keyof AddressInput>(
    key: K,
    value: AddressInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as keyof AddressErrors];
      return next;
    });
  };

  const handleSave = async () => {
    const nextErrors = validateAddress(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      Toast.show({
        type: "error",
        text1: "Check the highlighted fields",
        text2: "A few details are missing.",
      });
      return;
    }

    setSaving(true);
    try {
      if (id) {
        await update(id, form);
        Toast.show({ type: "success", text1: "Address updated" });
      } else {
        await create(form);
        Toast.show({ type: "success", text1: "Address saved" });
      }
      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not save address",
        text2: error?.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
        <CommonHeader title={id ? "Edit address" : "New address"} />
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.brand} />
        </View>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
        <CommonHeader title="Address" />
        <View style={styles.centered}>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {fetchError}
          </Text>
          <Button
            title="Go back"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  const isFirstAddress = !id && addressCount === 0;
  const isDefault = isFirstAddress || form.isDefault;

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <CommonHeader title={id ? "Edit address" : "New address"} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView edges={["bottom"]} style={styles.flex}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <View style={styles.heading}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {id ? "Update your address" : "Where should we deliver?"}
              </Text>
              <Text
                style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              >
                We only use these details to deliver your orders.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Label
              </Text>
              <View style={styles.chipRow}>
                {labelPresets.map((preset) => (
                  <Chip
                    key={preset}
                    label={preset}
                    selected={form.label.trim().toLowerCase() === preset.toLowerCase()}
                    onPress={() => setField("label", preset)}
                  />
                ))}
              </View>
            </View>

            <Field
              label="Recipient name"
              icon="account-outline"
              value={form.recipient}
              onChangeText={(value) => setField("recipient", value)}
              placeholder="Full name"
              autoCapitalize="words"
              autoComplete="name"
              error={errors.recipient}
            />

            <Field
              label="Phone (optional)"
              icon="phone-outline"
              value={form.phone ?? ""}
              onChangeText={(value) => setField("phone", value || null)}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
              autoComplete="tel"
              error={errors.phone}
            />

            <Field
              label="Street address"
              icon="map-marker-outline"
              value={form.line1}
              onChangeText={(value) => setField("line1", value)}
              placeholder="123 Market Street"
              autoComplete="street-address"
              error={errors.line1}
            />

            <Field
              label="Apartment, suite, etc. (optional)"
              icon="office-building-outline"
              value={form.line2 ?? ""}
              onChangeText={(value) => setField("line2", value || null)}
              placeholder="Apt 4B"
            />

            <Field
              label="City"
              icon="city-variant-outline"
              value={form.city}
              onChangeText={(value) => setField("city", value)}
              placeholder="San Francisco"
              autoCapitalize="words"
              error={errors.city}
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Field
                  label="State (optional)"
                  value={form.state ?? ""}
                  onChangeText={(value) => setField("state", value || null)}
                  placeholder="CA"
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.rowItem}>
                <Field
                  label="Postal code"
                  value={form.postalCode}
                  onChangeText={(value) => setField("postalCode", value)}
                  placeholder="94103"
                  autoComplete="postal-code"
                  error={errors.postalCode}
                />
              </View>
            </View>

            <Field
              label="Country"
              icon="earth"
              value={form.country}
              onChangeText={(value) => setField("country", value)}
              placeholder="US"
              autoCapitalize="characters"
              autoComplete="country"
              error={errors.country}
            />

            <View
              style={[
                styles.defaultCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isDefault
                    ? theme.colors.brand
                    : theme.colors.border,
                },
              ]}
            >
              <View style={styles.defaultCopy}>
                <Text style={[styles.defaultTitle, { color: theme.colors.text }]}>
                  Use as default address
                </Text>
                <Text
                  style={[
                    styles.defaultDetail,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {isFirstAddress
                    ? "Your first address is automatically the default."
                    : "We'll pre-select this address at checkout."}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Use as default address"
                value={isDefault}
                onValueChange={(value) => setField("isDefault", value)}
                disabled={isFirstAddress}
                trackColor={{
                  false: theme.colors.surfaceMuted,
                  true: theme.colors.brand,
                }}
                thumbColor={theme.colors.surface}
                ios_backgroundColor={theme.colors.surfaceMuted}
              />
            </View>

            <Button
              title={id ? "Save changes" : "Save address"}
              onPress={handleSave}
              loading={saving}
              size="large"
              fullWidth
            />
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="ghost"
              fullWidth
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  icon,
  error,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  error?: string;
}) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error
              ? theme.colors.error
              : focused
                ? theme.colors.brand
                : theme.colors.border,
          },
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={theme.colors.textMuted}
          />
        ) : null}
        <TextInput
          {...inputProps}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.text }]}
        />
      </View>
      {error ? (
        <Text style={[styles.fieldError, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space[5],
    paddingHorizontal: space[7],
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    textAlign: "center",
  },
  content: {
    paddingHorizontal: space[7],
    paddingTop: space[2],
    paddingBottom: space[9],
    gap: space[5],
  },
  heading: {
    gap: space[2],
    marginBottom: space[1],
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  field: {
    gap: space[2],
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  chipRow: {
    flexDirection: "row",
    gap: space[3],
  },
  row: {
    flexDirection: "row",
    gap: space[4],
  },
  rowItem: {
    flex: 1,
  },
  inputWrap: {
    minHeight: 50,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingHorizontal: space[4],
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
  },
  fieldError: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
  },
  defaultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    padding: space[4],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  defaultCopy: {
    flex: 1,
    gap: 2,
  },
  defaultTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
  },
  defaultDetail: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
  },
});
