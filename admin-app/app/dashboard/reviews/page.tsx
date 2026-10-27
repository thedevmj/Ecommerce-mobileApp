import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Search,
  Star,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ConfirmDeleteForm from "@/components/catalog/ConfirmDeleteForm";
import {
  CATALOG_PAGE_SIZE,
  formatCatalogDate,
  type ReviewWithProduct,
} from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { deleteReview } from "./actions";

export const metadata: Metadata = {
  title: "Reviews · Shopcart Admin",
};

type ReviewsSearchParams = {
  rating?: string | string[];
  q?: string | string[];
  page?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function reviewsHref({
  rating,
  q,
  page,
}: {
  rating?: number | null;
  q?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (rating) params.set("rating", String(rating));
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/dashboard/reviews?${query}` : "/dashboard/reviews";
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={13}
          className={
            index < rating ? "fill-accent text-accent" : "text-line"
          }
        />
      ))}
    </span>
  );
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<ReviewsSearchParams>;
}) {
  const params = await searchParams;
  const rawRating = first(params.rating);
  const rating =
    rawRating && /^[1-5]$/.test(rawRating) ? Number(rawRating) : null;
  const q = (first(params.q) ?? "").trim().slice(0, 80);
  const search = q.replace(/[%_(),]/g, " ").trim();
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const supabase = await createClient();

  let reviewsQuery = supabase
    .from("reviews")
    .select("*, products(title, slug)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (rating) reviewsQuery = reviewsQuery.eq("rating", rating);
  if (search) {
    reviewsQuery = reviewsQuery.or(
      `title.ilike.%${search}%,body.ilike.%${search}%`
    );
  }

  const ratingCounts = await Promise.all(
    [5, 4, 3, 2, 1].map(async (value) => {
      const { count } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("rating", value);

      return [value, count ?? 0] as const;
    })
  );

  const [reviewsResult, allCountResult] = await Promise.all([
    reviewsQuery.range(
      (page - 1) * CATALOG_PAGE_SIZE,
      page * CATALOG_PAGE_SIZE - 1
    ),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
  ]);

  const reviews = (reviewsResult.data ?? []) as ReviewWithProduct[];
  const userIds = Array.from(new Set(reviews.map((review) => review.user_id)));
  const names = new Map<string, string>();

  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    for (const profile of profiles ?? []) {
      if (profile.full_name) names.set(profile.id, profile.full_name);
    }
  }

  const countMap = new Map<number, number>(ratingCounts);
  const total = reviewsResult.count ?? 0;
  const allCount = allCountResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const firstResult = total === 0 ? 0 : (page - 1) * CATALOG_PAGE_SIZE + 1;
  const lastResult = Math.min(page * CATALOG_PAGE_SIZE, total);
  const hasFilters = Boolean(q || rating);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customers"
        title="Reviews"
        description="Read customer feedback and remove reviews that break store guidelines."
        action={
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-2 text-xs font-semibold text-brand-strong">
            <MessageSquare size={14} />
            {allCount} total
          </span>
        }
      />

      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-panel p-1.5 shadow-sm">
        <Link
          href={reviewsHref({ q, page: 1 })}
          aria-current={rating === null ? "page" : undefined}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
            rating === null
              ? "bg-brand text-white shadow-sm"
              : "text-muted hover:bg-canvas hover:text-ink"
          }`}
        >
          All
          <span
            className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              rating === null ? "bg-white/20 text-white" : "bg-canvas text-muted"
            }`}
          >
            {allCount}
          </span>
        </Link>

        {[5, 4, 3, 2, 1].map((value) => {
          const active = rating === value;

          return (
            <Link
              key={value}
              href={reviewsHref({ rating: value, q, page: 1 })}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              {value}
              <Star
                size={13}
                className={active ? "fill-white text-white" : "fill-accent text-accent"}
              />
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  active ? "bg-white/20 text-white" : "bg-canvas text-muted"
                }`}
              >
                {countMap.get(value) ?? 0}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          action="/dashboard/reviews"
          className="flex w-full max-w-lg items-center gap-2"
        >
          {rating ? (
            <input type="hidden" name="rating" value={rating} />
          ) : null}
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search review text</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search review title or body"
              className="h-10 w-full rounded-xl border border-line bg-panel pl-10 pr-3.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        {hasFilters ? (
          <Link
            href="/dashboard/reviews"
            className="text-sm font-medium text-brand transition hover:text-brand-strong"
          >
            Reset filters
          </Link>
        ) : null}
      </div>

      {reviewsResult.error ? (
        <div className="rounded-3xl border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-semibold text-danger">Could not load reviews</p>
              <p className="mt-1 text-sm leading-6 text-danger/80">
                {reviewsResult.error.message}
              </p>
              <p className="mt-2 text-xs leading-5 text-danger/70">
                Confirm migrations `0002_reviewer_profiles.sql` and
                `0004_admin_roles.sql` are applied.
              </p>
            </div>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-3xl border border-line bg-panel px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
            <MessageSquare size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No reviews found</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
            {hasFilters
              ? "No reviews match these filters. Try clearing the search or rating."
              : "Reviews submitted in the mobile app will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const author = names.get(review.user_id) ?? "Customer";
            const initial = author.trim().charAt(0).toUpperCase() || "C";

            return (
              <article
                key={review.id}
                className="rounded-3xl border border-line bg-panel p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{author}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <Stars rating={review.rating} />
                        <span className="text-xs text-muted">
                          {formatCatalogDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        review.rating >= 4
                          ? "bg-success-soft text-success"
                          : review.rating === 3
                            ? "bg-warning-soft text-warning"
                            : "bg-danger-soft text-danger"
                      }`}
                    >
                      {review.rating} star{review.rating === 1 ? "" : "s"}
                    </span>
                    {review.products ? (
                      <Link
                        href={`/dashboard/products/${review.product_id}`}
                        className="max-w-52 truncate text-xs font-medium text-brand transition hover:text-brand-strong"
                      >
                        {review.products.title}
                      </Link>
                    ) : null}
                  </div>
                </div>

                {review.title ? (
                  <h3 className="mt-3 text-sm font-semibold">{review.title}</h3>
                ) : null}
                {review.body ? (
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted">
                    {review.body}
                  </p>
                ) : null}

                <div className="mt-3 border-t border-line pt-3">
                  <ConfirmDeleteForm
                    action={deleteReview}
                    idName="review_id"
                    id={review.id}
                    message="Delete this review? The product rating will be recalculated."
                    label="Delete review"
                    successMessage="Review deleted."
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Showing {firstResult}–{lastResult} of {total} reviews
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={reviewsHref({ rating, q, page: page - 1 })}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-line bg-panel px-3 text-sm font-medium shadow-sm transition hover:bg-canvas"
              >
                <ChevronLeft size={15} />
                Previous
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center gap-1 rounded-xl border border-line bg-panel px-3 text-sm font-medium text-muted opacity-50">
                <ChevronLeft size={15} />
                Previous
              </span>
            )}
            <span className="text-xs text-muted">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={reviewsHref({ rating, q, page: page + 1 })}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-line bg-panel px-3 text-sm font-medium shadow-sm transition hover:bg-canvas"
              >
                Next
                <ChevronRight size={15} />
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center gap-1 rounded-xl border border-line bg-panel px-3 text-sm font-medium text-muted opacity-50">
                Next
                <ChevronRight size={15} />
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
