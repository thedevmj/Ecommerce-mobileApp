import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import Button from "@/components/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Rating } from "@/components/ui/Rating";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { radius, space, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatDate } from "@/lib/format";
import {
  Review,
  fetchReviews,
  isUuid,
  submitReview,
  summarizeReviews,
} from "@/lib/reviews";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

interface ProductReviewsProps {
  productId: string | number;
  onReviewSubmitted?: () => void;
}

const ratingLabels = ["Poor", "Fair", "Good", "Great", "Excellent"];

const initialsFor = (name: string | null) => {
  if (!name) return "C";

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "C";
};

export default function ProductReviews({
  productId,
  onReviewSubmitted,
}: ProductReviewsProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const canUseReviews = isSupabaseConfigured && isUuid(productId);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(canUseReviews);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [ratingDraft, setRatingDraft] = useState(0);
  const [titleDraft, setTitleDraft] = useState("");
  const [bodyDraft, setBodyDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!canUseReviews) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchReviews(String(productId));
        if (active) setReviews(data);
      } catch {
        if (active) setError("We couldn't load reviews right now.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [productId, canUseReviews, refreshKey]);

  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);

  const myReview = useMemo(
    () => (user ? reviews.find((review) => review.userId === user.id) : undefined),
    [reviews, user]
  );

  const openForm = () => {
    if (!user) {
      Toast.show({
        type: "info",
        text1: "Sign in to review",
        text2: "Your account keeps your reviews in one place.",
      });
      router.push("/auth");
      return;
    }

    setRatingDraft(myReview?.rating ?? 0);
    setTitleDraft(myReview?.title ?? "");
    setBodyDraft(myReview?.body ?? "");
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (ratingDraft < 1) {
      setFormError("Choose a star rating before posting.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await submitReview(String(productId), user.id, {
        rating: ratingDraft,
        title: titleDraft,
        body: bodyDraft,
      });

      Toast.show({
        type: "success",
        text1: myReview ? "Review updated" : "Review posted",
        text2: "Thanks for helping other shoppers.",
      });

      setFormOpen(false);
      setRefreshKey((value) => value + 1);
      onReviewSubmitted?.();
    } catch {
      setFormError("We couldn't save your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderReview = (review: Review, divider: boolean) => (
    <View
      key={review.id}
      style={[
        styles.review,
        divider && { borderTopWidth: 1, borderTopColor: theme.colors.border },
      ]}
    >
      <View style={styles.reviewHeader}>
        <View
          style={[styles.avatar, { backgroundColor: theme.colors.brandSoft }]}
        >
          <Text style={[styles.avatarText, { color: theme.colors.brand }]}>
            {initialsFor(review.authorName)}
          </Text>
        </View>

        <View style={styles.reviewer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {review.authorName ?? "Customer"}
            </Text>
            {user?.id === review.userId ? (
              <Badge label="You" tone="brand" />
            ) : null}
          </View>
          <Text style={[styles.date, { color: theme.colors.textMuted }]}>
            {formatDate(review.createdAt)}
          </Text>
        </View>

        <Rating
          rate={review.rating}
          size={12}
          showCount={false}
          showRate={false}
        />
      </View>

      {review.title ? (
        <Text style={[styles.reviewTitle, { color: theme.colors.text }]}>
          {review.title}
        </Text>
      ) : null}

      {review.body ? (
        <Text
          style={[styles.reviewBody, { color: theme.colors.textSecondary }]}
        >
          {review.body}
        </Text>
      ) : null}
    </View>
  );

  const actionLabel = myReview ? "Edit your review" : "Write a review";

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Reviews"
        actionLabel={canUseReviews ? actionLabel : undefined}
        onAction={canUseReviews ? openForm : undefined}
      />

      {!canUseReviews ? (
        <View
          style={[
            styles.note,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="message-outline"
            size={18}
            color={theme.colors.textMuted}
          />
          <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
            Reviews are unavailable for this product.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.skeletonGroup}>
          <Skeleton height={96} />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      ) : error ? (
        <View
          style={[
            styles.note,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color={theme.colors.textMuted}
          />
          <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <Button
            title="Retry"
            variant="outline"
            size="small"
            onPress={() => setRefreshKey((value) => value + 1)}
          />
        </View>
      ) : (
        <>
          {summary.count > 0 ? (
            <View
              style={[
                styles.summary,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.summaryScore}>
                <Text style={[styles.score, { color: theme.colors.text }]}>
                  {summary.average.toFixed(1)}
                </Text>
                <Rating
                  rate={summary.average}
                  size={14}
                  showCount={false}
                  showRate={false}
                />
                <Text
                  style={[styles.summaryCount, { color: theme.colors.textMuted }]}
                >
                  {summary.count} {summary.count === 1 ? "review" : "reviews"}
                </Text>
              </View>

              <View style={styles.distribution}>
                {summary.distribution.map((item) => (
                  <View key={item.rating} style={styles.distributionRow}>
                    <Text
                      style={[
                        styles.distributionLabel,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      {item.rating}
                    </Text>
                    <MaterialCommunityIcons
                      name="star"
                      size={10}
                      color={theme.colors.warning}
                    />
                    <View
                      style={[
                        styles.track,
                        { backgroundColor: theme.colors.surfaceMuted },
                      ]}
                    >
                      <View
                        style={[
                          styles.trackFill,
                          {
                            width: `${item.percent}%` as `${number}%`,
                            backgroundColor: theme.colors.warning,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.distributionCount,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {formOpen ? (
            <View
              style={[
                styles.form,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                {myReview ? "Update your review" : "Share your experience"}
              </Text>

              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    accessibilityRole="radio"
                    accessibilityLabel={`${star} out of 5 stars`}
                    accessibilityState={{ selected: ratingDraft === star }}
                    hitSlop={4}
                    onPress={() => {
                      setRatingDraft(star);
                      setFormError(null);
                    }}
                    style={styles.starButton}
                  >
                    <MaterialCommunityIcons
                      name={star <= ratingDraft ? "star" : "star-outline"}
                      size={30}
                      color={
                        star <= ratingDraft
                          ? theme.colors.warning
                          : theme.colors.borderStrong
                      }
                    />
                  </Pressable>
                ))}
                <Text
                  style={[styles.ratingHint, { color: theme.colors.textMuted }]}
                >
                  {ratingDraft > 0
                    ? ratingLabels[ratingDraft - 1]
                    : "Tap a star to rate"}
                </Text>
              </View>

              <View style={styles.field}>
                <Text
                  style={[styles.fieldLabel, { color: theme.colors.textMuted }]}
                >
                  Headline
                </Text>
                <TextInput
                  value={titleDraft}
                  onChangeText={setTitleDraft}
                  placeholder="Sum it up in a few words (optional)"
                  placeholderTextColor={theme.colors.textMuted}
                  maxLength={80}
                  returnKeyType="next"
                  accessibilityLabel="Review headline"
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                />
              </View>

              <View style={styles.field}>
                <Text
                  style={[styles.fieldLabel, { color: theme.colors.textMuted }]}
                >
                  Your review
                </Text>
                <TextInput
                  value={bodyDraft}
                  onChangeText={setBodyDraft}
                  placeholder="What did you like or dislike?"
                  placeholderTextColor={theme.colors.textMuted}
                  maxLength={600}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Review details"
                  style={[
                    styles.input,
                    styles.textarea,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.characterCount,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {bodyDraft.length}/600
                </Text>
              </View>

              {formError ? (
                <Text style={[styles.formError, { color: theme.colors.error }]}>
                  {formError}
                </Text>
              ) : null}

              <View style={styles.formActions}>
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={closeForm}
                  disabled={submitting}
                />
                <Button
                  title={myReview ? "Update review" : "Post review"}
                  onPress={handleSubmit}
                  loading={submitting}
                  style={styles.submitButton}
                />
              </View>
            </View>
          ) : null}

          {reviews.length > 0 ? (
            <View>{reviews.map((review, index) => renderReview(review, index > 0))}</View>
          ) : !formOpen ? (
            <EmptyState
              icon="message-text-outline"
              title="No reviews yet"
              message="Share what you liked or didn't. Your review helps other shoppers decide."
              actionLabel="Be the first to review"
              onAction={openForm}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space[4],
  },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    padding: space[5],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  skeletonGroup: {
    gap: space[3],
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[6],
    padding: space[5],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  summaryScore: {
    alignItems: "center",
    gap: space[2],
    minWidth: 96,
  },
  score: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
  },
  summaryCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
  },
  distribution: {
    flex: 1,
    gap: space[2],
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  distributionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    width: 10,
    textAlign: "right",
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  distributionCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    width: 22,
    textAlign: "right",
  },
  form: {
    gap: space[4],
    padding: space[5],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  formTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
  starPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[1],
  },
  starButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingHint: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    marginLeft: space[2],
  },
  field: {
    gap: space[2],
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
  },
  textarea: {
    minHeight: 96,
    paddingTop: space[3],
  },
  characterCount: {
    alignSelf: "flex-end",
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
  },
  formError: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  submitButton: {
    flex: 1,
  },
  review: {
    gap: space[3],
    paddingVertical: space[5],
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
  },
  reviewer: {
    flex: 1,
    gap: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  name: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
  date: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
  },
  reviewTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
  },
  reviewBody: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
  },
});
