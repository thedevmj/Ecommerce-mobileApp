import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Button from "@/components/Button";
import CommonHeader from "@/components/CommonHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  Enquiry,
  EnquiryErrors,
  ENQUIRY_STATUS_META,
  EnquiryStatus,
  createEnquiry,
  fetchEnquiries,
  validateEnquiry,
} from "@/lib/enquiries";
import { formatDate } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

type Contact = {
  name: string;
  phone: string | null;
};

const STATUS_TONES: Record<
  EnquiryStatus,
  "brand" | "stock" | "low" | "out"
> = {
  open: "low",
  in_progress: "brand",
  resolved: "stock",
  closed: "out",
};

export default function EnquiriesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contact, setContact] = useState<Contact>({ name: "", phone: null });
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const loadEnquiries = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      return {
        list: [] as Enquiry[],
        contact: { name: "", phone: null } as Contact,
      };
    }

    const [list, profile] = await Promise.all([
      fetchEnquiries(user.id),
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    return {
      list,
      contact: {
        name:
          profile.data?.full_name?.trim() ||
          user.email.split("@")[0] ||
          "Customer",
        phone: profile.data?.phone ?? null,
      },
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    loadEnquiries()
      .then((result) => {
        if (cancelled) return;
        setEnquiries(result.list);
        setContact(result.contact);
        setLoadError(null);
      })
      .catch((err: any) => {
        if (!cancelled) setLoadError(err?.message || "Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadEnquiries]);

  const handleRefresh = async (pullToRefresh = false) => {
    if (pullToRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await loadEnquiries();
      setEnquiries(result.list);
      setContact(result.contact);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err?.message || "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;

    const nextErrors = validateEnquiry({ subject, message });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const created = await createEnquiry(user.id, {
        name: contact.name,
        email: user.email,
        phone: contact.phone,
        subject,
        message,
      });

      setEnquiries((current) => [created, ...current]);
      setSubject("");
      setMessage("");
      setErrors({});
      Toast.show({
        type: "success",
        text1: "Enquiry sent",
        text2: "We will reply to your email address.",
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Could not send enquiry",
        text2: err?.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <View
        style={[styles.wrapper, { backgroundColor: theme.colors.background }]}
      >
        <CommonHeader title="Help & enquiries" />
        <EmptyState
          icon="message-text-outline"
          title="Sign in to contact support"
          message="Sign in so we can link your enquiry to your account and reply by email."
          actionLabel="Sign in"
          onAction={() => router.push("/auth")}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <CommonHeader title="Help & enquiries" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => handleRefresh(true)}
              tintColor={theme.colors.brand}
              colors={[theme.colors.brand]}
            />
          }
          contentContainerStyle={styles.content}
        >
          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              How can we help?
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            >
              Ask about an order, a product, delivery, or anything else. Our
              support team replies to your account email.
            </Text>
          </View>

          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.contactIcon,
                { backgroundColor: theme.colors.brandSoft },
              ]}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={theme.colors.brand}
              />
            </View>
            <View style={styles.contactCopy}>
              <Text style={[styles.contactLabel, { color: theme.colors.textMuted }]}>
                REPLY TO
              </Text>
              <Text
                style={[styles.contactValue, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {user.email}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>
              Send a new enquiry
            </Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Subject
              </Text>
              <TextInput
                value={subject}
                onChangeText={(value) => {
                  setSubject(value);
                  if (errors.subject) {
                    setErrors((current) => ({ ...current, subject: undefined }));
                  }
                }}
                placeholder="What can we help with?"
                placeholderTextColor={theme.colors.textMuted}
                maxLength={140}
                accessibilityLabel="Enquiry subject"
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: errors.subject
                      ? theme.colors.error
                      : theme.colors.border,
                  },
                ]}
              />
              {errors.subject ? (
                <Text style={[styles.error, { color: theme.colors.error }]}>
                  {errors.subject}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <View style={styles.messageLabelRow}>
                <Text
                  style={[styles.label, { color: theme.colors.textSecondary }]}
                >
                  Message
                </Text>
                <Text style={[styles.count, { color: theme.colors.textMuted }]}>
                  {message.length}/4000
                </Text>
              </View>
              <TextInput
                value={message}
                onChangeText={(value) => {
                  setMessage(value);
                  if (errors.message) {
                    setErrors((current) => ({ ...current, message: undefined }));
                  }
                }}
                placeholder="Include any details that will help us assist you."
                placeholderTextColor={theme.colors.textMuted}
                maxLength={4000}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Enquiry message"
                style={[
                  styles.input,
                  styles.messageInput,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: errors.message
                      ? theme.colors.error
                      : theme.colors.border,
                  },
                ]}
              />
              {errors.message ? (
                <Text style={[styles.error, { color: theme.colors.error }]}>
                  {errors.message}
                </Text>
              ) : null}
            </View>

            <Button
              title="Send enquiry"
              icon="send-outline"
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
            />
          </View>

          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: theme.colors.text }]}>
              Your enquiries
            </Text>
            <Text style={[styles.historyCount, { color: theme.colors.textMuted }]}>
              {enquiries.length}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.brand} />
            </View>
          ) : loadError ? (
            <View
              style={[
                styles.errorCard,
                {
                  backgroundColor: theme.colors.errorSoft,
                  borderColor: theme.colors.error,
                },
              ]}
            >
              <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
                Could not load enquiries
              </Text>
              <Text
                style={[styles.errorBody, { color: theme.colors.textSecondary }]}
              >
                {loadError}
              </Text>
              <Button
                title="Try again"
                variant="outline"
                size="small"
                onPress={() => handleRefresh()}
              />
            </View>
          ) : enquiries.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              No enquiries yet. Send your first message above.
            </Text>
          ) : (
            <View style={styles.list}>
              {enquiries.map((enquiry) => {
                const meta = ENQUIRY_STATUS_META[enquiry.status];
                return (
                  <View
                    key={enquiry.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.cardTop}>
                      <Text
                        style={[styles.cardTitle, { color: theme.colors.text }]}
                      >
                        {enquiry.subject}
                      </Text>
                      <Badge
                        label={meta.label}
                        tone={STATUS_TONES[enquiry.status]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.cardDate,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      {formatDate(enquiry.createdAt)}
                    </Text>
                    <Text
                      style={[
                        styles.cardMessage,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={3}
                    >
                      {enquiry.message}
                    </Text>
                    <Text
                      style={[
                        styles.statusHint,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      {meta.description}
                    </Text>

                    {enquiry.adminReply ? (
                      <View
                        style={[
                          styles.replyCard,
                          {
                            backgroundColor: theme.colors.brandSoft,
                            borderColor: theme.colors.brand,
                          },
                        ]}
                      >
                        <View style={styles.replyHeader}>
                          <MaterialCommunityIcons
                            name="message-reply-text-outline"
                            size={16}
                            color={theme.colors.brand}
                          />
                          <Text
                            style={[
                              styles.replyLabel,
                              { color: theme.colors.brand },
                            ]}
                          >
                            Support reply
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.replyBody,
                            { color: theme.colors.text },
                          ]}
                        >
                          {enquiry.adminReply}
                        </Text>
                        {enquiry.repliedAt ? (
                          <Text
                            style={[
                              styles.replyDate,
                              { color: theme.colors.textMuted },
                            ]}
                          >
                            {formatDate(enquiry.repliedAt)}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    paddingHorizontal: space[7],
    paddingTop: space[2],
    paddingBottom: space[10],
    gap: space[6],
  },
  heading: {
    gap: space[2],
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 27,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space[4],
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  contactCopy: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  contactValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space[5],
    gap: space[5],
  },
  formTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
  },
  field: {
    gap: space[2],
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  messageLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
  },
  messageInput: {
    minHeight: 140,
    paddingTop: space[4],
  },
  error: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space[2],
  },
  historyTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
  },
  historyCount: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  loading: {
    paddingVertical: space[8],
    alignItems: "center",
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space[5],
    gap: space[3],
  },
  errorTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
  errorBody: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  list: {
    gap: space[4],
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space[5],
    gap: space[2],
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space[4],
  },
  cardTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 21,
  },
  cardDate: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
  },
  cardMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: space[1],
  },
  statusHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  replyCard: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: space[4],
    gap: space[2],
    marginTop: space[2],
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  replyLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  replyBody: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  replyDate: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
  },
});
