import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function NotFoundScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.orb, { backgroundColor: theme.colors.brandSoft }]}>
        <MaterialCommunityIcons
          name="compass-outline"
          size={36}
          color={theme.colors.brand}
        />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Page not found
      </Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        The page you were looking for may have moved or no longer exists.
      </Text>
      <Button title="Go to home" onPress={() => router.replace("/")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space[8],
    gap: space[4],
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space[3],
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    letterSpacing: -0.4,
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 300,
    marginBottom: space[3],
  },
});
