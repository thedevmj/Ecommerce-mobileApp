import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "@/components/Button";
import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { radius, shadows, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  PriceBounds,
  PricePreset,
  ShopFilters,
  SortKey,
  activeFilterCount,
  ratingOptions,
  sortOptions,
} from "@/lib/shopFilters";

interface FilterSheetProps {
  onClose: () => void;
  filters: ShopFilters;
  sort: SortKey;
  brands: string[];
  presets: PricePreset[];
  bounds: PriceBounds;
  onApply: (filters: ShopFilters, sort: SortKey) => void;
  countResults: (filters: ShopFilters) => number;
}

const BRAND_PREVIEW_COUNT = 8;

const sanitizePrice = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${whole}.${rest.join("")}` : whole;
};

const toPrice = (value: string): number | null => {
  if (value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  const theme = useAppTheme();

  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
      {children}
    </Text>
  );
}

export default function FilterSheet({
  onClose,
  filters,
  sort,
  brands,
  presets,
  bounds,
  onApply,
  countResults,
}: FilterSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const [reduceMotion, setReduceMotion] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));

  const [draft, setDraft] = useState<ShopFilters>(filters);
  const [draftSort, setDraftSort] = useState<SortKey>(sort);
  const [minText, setMinText] = useState(
    filters.minPrice != null ? String(filters.minPrice) : ""
  );
  const [maxText, setMaxText] = useState(
    filters.maxPrice != null ? String(filters.maxPrice) : ""
  );
  const [showAllBrands, setShowAllBrands] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reduceMotion ? 0 : 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [progress, reduceMotion]);

  const handleClose = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion ? 0 : 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const count = countResults(draft);
  const priceInvalid =
    draft.minPrice != null &&
    draft.maxPrice != null &&
    draft.minPrice > draft.maxPrice;
  const hasActiveDraft =
    activeFilterCount(draft) > 0 || draftSort !== DEFAULT_SORT;

  const visibleBrands = useMemo(
    () =>
      showAllBrands ? brands : brands.slice(0, BRAND_PREVIEW_COUNT),
    [brands, showAllBrands]
  );

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const updateDraft = (patch: Partial<ShopFilters>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleMinChange = (value: string) => {
    const next = sanitizePrice(value);
    setMinText(next);
    updateDraft({ minPrice: toPrice(next) });
  };

  const handleMaxChange = (value: string) => {
    const next = sanitizePrice(value);
    setMaxText(next);
    updateDraft({ maxPrice: toPrice(next) });
  };

  const isPresetActive = (preset: PricePreset) =>
    draft.minPrice === preset.min && draft.maxPrice === preset.max;

  const togglePreset = (preset: PricePreset) => {
    if (isPresetActive(preset)) {
      setMinText("");
      setMaxText("");
      updateDraft({ minPrice: null, maxPrice: null });
      return;
    }

    setMinText(preset.min != null ? String(preset.min) : "");
    setMaxText(preset.max != null ? String(preset.max) : "");
    updateDraft({ minPrice: preset.min, maxPrice: preset.max });
  };

  const toggleBrand = (brand: string) => {
    setDraft((current) => ({
      ...current,
      brands: current.brands.includes(brand)
        ? current.brands.filter((item) => item !== brand)
        : [...current.brands, brand],
    }));
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
    setDraftSort(DEFAULT_SORT);
    setMinText("");
    setMaxText("");
  };

  const handleApply = () => {
    if (priceInvalid) return;
    onApply({ ...draft, brands: [...draft.brands] }, draftSort);
    handleClose();
  };

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.overlay, opacity: progress },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss filters"
            onPress={handleClose}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              height: height * 0.92,
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(insets.bottom, space[6]),
              transform: [{ translateY }],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.flex}
          >
            <View style={styles.handleRow}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: theme.colors.borderStrong },
                ]}
              />
            </View>

            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleCopy}>
                <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                  Filter & Sort
                </Text>
                <Text
                  style={[
                    styles.sheetSubtitle,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {count} {count === 1 ? "product" : "products"}
                </Text>
              </View>
              <IconButton
                icon="close"
                accessibilityLabel="Close filters"
                onPress={handleClose}
              />
            </View>

            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.section}>
                <SectionTitle>Sort by</SectionTitle>
                <View style={styles.sortList}>
                  {sortOptions.map((option) => {
                    const selected = draftSort === option.key;

                    return (
                      <Pressable
                        key={option.key}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={option.label}
                        onPress={() => setDraftSort(option.key)}
                        style={({ pressed }) => [
                          styles.sortRow,
                          {
                            backgroundColor: selected
                              ? theme.colors.brandSoft
                              : theme.colors.surface,
                            borderColor: selected
                              ? theme.colors.brand
                              : theme.colors.border,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <View style={styles.sortCopy}>
                          <Text
                            style={[
                              styles.sortLabel,
                              { color: theme.colors.text },
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text
                            style={[
                              styles.sortDescription,
                              { color: theme.colors.textMuted },
                            ]}
                          >
                            {option.description}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name={
                            selected ? "radiobox-marked" : "radiobox-blank"
                          }
                          size={20}
                          color={
                            selected
                              ? theme.colors.brand
                              : theme.colors.textMuted
                          }
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <SectionTitle>Price</SectionTitle>
                <View style={styles.presetRow}>
                  {presets.map((preset) => (
                    <Chip
                      key={preset.key}
                      label={preset.label}
                      selected={isPresetActive(preset)}
                      onPress={() => togglePreset(preset)}
                    />
                  ))}
                </View>

                <View style={styles.priceRow}>
                  <View style={styles.priceField}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Min
                    </Text>
                    <View
                      style={[
                        styles.inputWrap,
                        {
                          backgroundColor: theme.colors.surfaceMuted,
                          borderColor: priceInvalid
                            ? theme.colors.error
                            : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currency,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        $
                      </Text>
                      <TextInput
                        value={minText}
                        onChangeText={handleMinChange}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        placeholder={String(bounds.min)}
                        placeholderTextColor={theme.colors.textMuted}
                        maxLength={8}
                        accessibilityLabel="Minimum price"
                        style={[styles.input, { color: theme.colors.text }]}
                      />
                    </View>
                  </View>

                  <Text
                    style={[styles.priceDash, { color: theme.colors.textMuted }]}
                  >
                    –
                  </Text>

                  <View style={styles.priceField}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Max
                    </Text>
                    <View
                      style={[
                        styles.inputWrap,
                        {
                          backgroundColor: theme.colors.surfaceMuted,
                          borderColor: priceInvalid
                            ? theme.colors.error
                            : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currency,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        $
                      </Text>
                      <TextInput
                        value={maxText}
                        onChangeText={handleMaxChange}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        placeholder={String(bounds.max)}
                        placeholderTextColor={theme.colors.textMuted}
                        maxLength={8}
                        accessibilityLabel="Maximum price"
                        style={[styles.input, { color: theme.colors.text }]}
                      />
                    </View>
                  </View>
                </View>

                {priceInvalid ? (
                  <Text style={[styles.error, { color: theme.colors.error }]}>
                    Minimum price must be lower than maximum price.
                  </Text>
                ) : null}
              </View>

              {brands.length > 0 ? (
                <View style={styles.section}>
                  <SectionTitle>Brand</SectionTitle>
                  <View style={styles.wrapRow}>
                    {visibleBrands.map((brand) => (
                      <Chip
                        key={brand}
                        label={brand}
                        selected={draft.brands.includes(brand)}
                        onPress={() => toggleBrand(brand)}
                      />
                    ))}
                  </View>
                  {brands.length > BRAND_PREVIEW_COUNT ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowAllBrands((current) => !current)}
                      hitSlop={4}
                      style={styles.linkRow}
                    >
                      <Text
                        style={[styles.link, { color: theme.colors.brand }]}
                      >
                        {showAllBrands
                          ? "Show fewer brands"
                          : `Show all ${brands.length} brands`}
                      </Text>
                      <MaterialCommunityIcons
                        name={showAllBrands ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={theme.colors.brand}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.section}>
                <SectionTitle>Customer rating</SectionTitle>
                <View style={styles.wrapRow}>
                  {ratingOptions.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={draft.minRating === option.value}
                      onPress={() => updateDraft({ minRating: option.value })}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            <View
              style={[
                styles.footer,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <Button
                title="Reset"
                variant="ghost"
                onPress={handleReset}
                disabled={!hasActiveDraft}
                style={styles.resetButton}
              />
              <Button
                title={`Show ${count} ${count === 1 ? "result" : "results"}`}
                onPress={handleApply}
                disabled={priceInvalid}
                style={styles.applyButton}
              />
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  flex: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: "hidden",
    ...shadows.lg,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: space[4],
    paddingBottom: space[2],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    opacity: 0.6,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space[7],
    paddingVertical: space[5],
  },
  sheetTitleCopy: {
    gap: 2,
  },
  sheetTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  body: {
    paddingHorizontal: space[7],
    paddingBottom: space[8],
    gap: space[8],
  },
  section: {
    gap: space[4],
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sortList: {
    gap: space[3],
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[4],
    minHeight: 56,
    paddingHorizontal: space[5],
    paddingVertical: space[4],
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  sortCopy: {
    flex: 1,
    gap: 1,
  },
  sortLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
  },
  sortDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[3],
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[3],
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space[4],
  },
  priceField: {
    flex: 1,
    gap: space[2],
  },
  inputLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  inputWrap: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space[4],
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  currency: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    paddingVertical: 0,
  },
  priceDash: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 16,
    paddingBottom: 14,
  },
  error: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: space[2],
    paddingVertical: space[2],
  },
  link: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    paddingHorizontal: space[7],
    paddingTop: space[5],
    borderTopWidth: 1,
  },
  resetButton: {
    minWidth: 96,
  },
  applyButton: {
    flex: 1,
  },
});
