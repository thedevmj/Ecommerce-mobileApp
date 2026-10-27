import { supabase } from "@/lib/supabase";

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  authorName: string | null;
}

export interface ReviewInput {
  rating: number;
  title: string;
  body: string;
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percent: number;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: RatingDistribution[];
}

interface ReviewRow {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string | number): boolean =>
  typeof value === "string" && UUID_PATTERN.test(value);

async function fetchAuthorNames(
  userIds: string[]
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from("reviewer_profiles")
      .select("id, full_name")
      .in("id", unique);

    if (error || !data) return {};

    return data.reduce<Record<string, string>>((names, row) => {
      if (row.full_name) names[row.id] = row.full_name;
      return names;
    }, {});
  } catch {
    return {};
  }
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, product_id, user_id, rating, title, body, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as ReviewRow[];
  const authorNames = await fetchAuthorNames(rows.map((row) => row.user_id));

  return rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    authorName: authorNames[row.user_id] ?? null,
  }));
}

export async function submitReview(
  productId: string,
  userId: string,
  input: ReviewInput
): Promise<void> {
  const { error } = await supabase.from("reviews").upsert(
    {
      product_id: productId,
      user_id: userId,
      rating: input.rating,
      title: input.title.trim() || null,
      body: input.body.trim() || null,
    },
    { onConflict: "product_id,user_id" }
  );

  if (error) throw error;
}

export function summarizeReviews(reviews: Review[]): ReviewSummary {
  const count = reviews.length;
  const average =
    count > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) / count
      : 0;

  const distribution = [5, 4, 3, 2, 1].map((rating) => {
    const ratingCount = reviews.filter(
      (review) => review.rating === rating
    ).length;

    return {
      rating,
      count: ratingCount,
      percent: count > 0 ? Math.round((ratingCount / count) * 100) : 0,
    };
  });

  return { average, count, distribution };
}
