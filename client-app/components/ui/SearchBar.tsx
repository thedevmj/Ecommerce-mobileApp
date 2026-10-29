import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { radius, sizes, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onClear?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search products, brands, categories",
  onSubmit,
  onClear,
  editable = true,
  autoFocus = false,
  style,
  onPress,
}: SearchBarProps) {
  const theme = useAppTheme();
  const content = (
    <>
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color={theme.colors.textMuted}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        onSubmitEditing={onSubmit}
        editable={editable && !onPress}
        autoFocus={autoFocus}
        returnKeyType="search"
        accessibilityLabel="Search products"
        style={[styles.input, { color: theme.colors.text }]}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={10}
          onPress={onClear ?? (() => onChangeText(""))}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={18}
            color={theme.colors.textMuted}
          />
        </Pressable>
      ) : (
        <MaterialCommunityIcons
          name="tune-variant"
          size={18}
          color={theme.colors.textMuted}
        />
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search products"
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.75 : 1,
          },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: sizes.inputHeight,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    paddingHorizontal: space[5],
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    height: "100%",
  },
});
