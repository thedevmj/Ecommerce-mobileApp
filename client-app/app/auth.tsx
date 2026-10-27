import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Button from "@/components/Button";
import { IconButton } from "@/components/ui/IconButton";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const { user, isLoading, error, login, signup } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.back();
    }
  }, [user, router]);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Toast.show({ type: "error", text1: "Missing details", text2: "Enter your email and password." });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: "error", text1: "Password too short", text2: "Use at least 6 characters." });
      return;
    }
    if (mode === "signup" && !accepted) {
      Toast.show({ type: "error", text1: "Accept the terms", text2: "Please agree to the terms to continue." });
      return;
    }

    if (mode === "signin") {
      await login(email.trim(), password);
    } else {
      await signup(email.trim(), password);
    }

    const nextError = useAuthStore.getState().error;
    if (nextError) {
      Toast.show({ type: "error", text1: "Could not continue", text2: nextError });
      return;
    }

    if (!isSupabaseConfigured) {
      Toast.show({
        type: "info",
        text1: "Auth is not connected yet",
        text2: "Add Supabase env vars to enable accounts.",
        visibilityTime: 2600,
      });
      return;
    }

    if (useAuthStore.getState().user) {
      Toast.show({ type: "success", text1: "You're in", text2: "Happy shopping." });
    } else if (mode === "signup") {
      Toast.show({
        type: "success",
        text1: "Check your inbox",
        text2: "Confirm your email to finish signing up.",
      });
    }
  };

  const handleSocial = (provider: string) =>
    Toast.show({
      type: "info",
      text1: `${provider} sign-in`,
      text2: "Social auth will be enabled with Supabase.",
    });

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <View
              style={[styles.mark, { backgroundColor: theme.colors.brand }]}
            >
              <MaterialCommunityIcons
                name="shopping"
                size={20}
                color={theme.colors.onBrand}
              />
            </View>
            <IconButton
              icon="close"
              accessibilityLabel="Close"
              onPress={close}
              background={theme.colors.surfaceMuted}
            />
          </View>

          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {mode === "signin"
                ? "Sign in to pick up your cart and track orders."
                : "Join shopcart for faster checkout and member-only drops."}
            </Text>
          </View>

          {!isSupabaseConfigured ? (
            <View
              style={[
                styles.notice,
                {
                  backgroundColor: theme.colors.warningSoft,
                  borderColor: theme.colors.warning,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="database-alert-outline"
                size={18}
                color={theme.colors.warning}
              />
              <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
                Demo mode — add your Supabase URL and anon key to enable real accounts.
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Field
              label="Email"
              icon="email-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Field
              label="Password"
              icon="lock-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightPress={() => setShowPassword((value) => !value)}
            />

            {mode === "signin" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  Toast.show({
                    type: "info",
                    text1: "Password reset",
                    text2: "Reset emails will be wired with Supabase.",
                  })
                }
                style={styles.forgot}
              >
                <Text style={[styles.forgotText, { color: theme.colors.brand }]}>
                  Forgot password?
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: accepted }}
                onPress={() => setAccepted((value) => !value)}
                style={styles.termsRow}
              >
                <MaterialCommunityIcons
                  name={accepted ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={20}
                  color={accepted ? theme.colors.brand : theme.colors.textMuted}
                />
                <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
                  I agree to the Terms of Service and Privacy Policy.
                </Text>
              </Pressable>
            )}

            {error ? (
              <Text style={[styles.error, { color: theme.colors.error }]}>
                {error}
              </Text>
            ) : null}

            <Button
              title={mode === "signin" ? "Sign in" : "Create account"}
              onPress={handleSubmit}
              loading={isLoading}
              fullWidth
              size="large"
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>
              or continue with
            </Text>
            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
          </View>

          <View style={styles.socialRow}>
            {[
              { icon: "google", label: "Google" },
              { icon: "apple", label: "Apple" },
              { icon: "facebook", label: "Facebook" },
            ].map((provider) => (
              <Pressable
                key={provider.label}
                accessibilityRole="button"
                accessibilityLabel={`Continue with ${provider.label}`}
                onPress={() => handleSocial(provider.label)}
                style={({ pressed }) => [
                  styles.socialButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={provider.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={20}
                  color={theme.colors.text}
                />
              </Pressable>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: theme.colors.textSecondary }]}>
              {mode === "signin" ? "New to shopcart?" : "Already have an account?"}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              <Text style={[styles.switchAction, { color: theme.colors.brand }]}>
                {mode === "signin" ? "Create account" : "Sign in"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  icon,
  rightIcon,
  onRightPress,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onRightPress?: () => void;
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
            borderColor: focused ? theme.colors.brand : theme.colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={theme.colors.textMuted}
        />
        <TextInput
          {...inputProps}
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
        {rightIcon && onRightPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle password visibility"
            hitSlop={8}
            onPress={onRightPress}
          >
            <MaterialCommunityIcons
              name={rightIcon}
              size={18}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space[7],
    paddingTop: space[3],
    paddingBottom: space[9],
    gap: space[6],
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mark: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    gap: space[3],
    marginTop: space[3],
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 30,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    padding: space[4],
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  form: {
    gap: space[5],
  },
  field: {
    gap: space[2],
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  inputWrap: {
    height: 50,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingHorizontal: space[4],
  },
  input: {
    flex: 1,
    height: "100%",
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
  },
  forgot: {
    alignSelf: "flex-end",
  },
  forgotText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  termsText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  error: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
  },
  socialRow: {
    flexDirection: "row",
    gap: space[4],
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: space[2],
    marginTop: space[2],
  },
  switchText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
  },
  switchAction: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
});
