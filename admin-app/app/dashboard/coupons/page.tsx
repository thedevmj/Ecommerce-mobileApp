import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  TicketPercent,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { formatMoney } from "@/lib/catalog";
import {
  COUPONS_PAGE_SIZE,
  couponDiscountLabel,
  couponExpiryLabel,
  couponState,
  couponStateLabel,
  couponStateTone,
  type Coupon,
} from "@/lib/coupons";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Coupons | Shopcart Admin",
};

type CouponsSearchParams = {
  q?: string | string[];
  status?: string | string[];
  page?: string | string[];
};

const statuses = [
  { value: null, label: "All" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "inactive", label: "Inactive" },
] as const;

type StatusFilter = (typeof statuses)[number]["value"];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isStatus(value: string | undefined): value is Exclude<StatusFilter, null> {
  return value === "active" || value === "expired" || value === "inactive";
}

function couponsHref({
  status,
  q,
  page,
}: {
  status?: StatusFilter;
  q?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/dashboard/coupons?${query}` : "/dashboard/coupons";
}

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<CouponsSearchParams>;
}) {
  const params = await searchParams;
  const rawStatus = first(params.status);
  const status = isStatus(rawStatus) ? rawStatus : null;
  const q = (first(params.q) ?? "").trim().slice(0, 80);
  const search = q.replace(/[%_(),]/g, " ").trim();
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const now = new Date().toISOString();

  const supabase = await createClient();
  let couponsQuery = supabase
    .from("coupons")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status === "active") {
    couponsQuery = couponsQuery
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${now}`);
  }
  if (status === "expired") {
    couponsQuery = couponsQuery.lte("expires_at", now);
  }
  if (status === "inactive") {
    couponsQuery = couponsQuery
      .eq("is_active", false)
      .or(`expires_at.is.null,expires_at.gt.${now}`);
  }
  if (search) {
    couponsQuery = couponsQuery.or(
      `code.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const [
    couponsResult,
    allCountResult,
    activeCountResult,
    expiredCountResult,
    inactiveCountResult,
  ] = await Promise.all([
    couponsQuery.range(
      (page - 1) * COUPONS_PAGE_SIZE,
      page * COUPONS_PAGE_SIZE - 1
    ),
    supabase.from("coupons").select("code", { count: "exact", head: true }),
    supabase
      .from("coupons")
      .select("code", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${now}`),
    supabase
      .from("coupons")
      .select("code", { count: "exact", head: true })
      .lte("expires_at", now),
    supabase
      .from("coupons")
      .select("code", { count: "exact", head: true })
      .eq("is_active", false)
      .or(`expires_at.is.null,expires_at.gt.${now}`),
  ]);

  const coupons = (couponsResult.data ?? []) as Coupon[];
  const total = couponsResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / COUPONS_PAGE_SIZE));
  const firstResult = total === 0 ? 0 : (page - 1) * COUPONS_PAGE_SIZE + 1;
  const lastResult = Math.min(page * COUPONS_PAGE_SIZE, total);
  const counts: Record<Exclude<StatusFilter, null>, number> = {
    active: activeCountResult.count ?? 0,
    expired: expiredCountResult.count ?? 0,
    inactive: inactiveCountResult.count ?? 0,
  };
  const allCount = allCountResult.count ?? 0;
  const hasFilters = Boolean(q || status);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Promotions"
        title="Coupons"
        description="Create and manage the promo codes customers can apply to cash-on-delivery orders."
        action={
          <Link
            href="/dashboard/coupons/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong"
          >
            <Plus size={16} />
            New coupon
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Coupons
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{allCount}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Active
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {counts.active}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Expired
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {counts.expired}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Inactive
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {counts.inactive}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-panel p-1.5 shadow-sm">
        {statuses.map((tab) => {
          const active = status === tab.value;
          const count = tab.value === null ? allCount : counts[tab.value];

          return (
            <Link
              key={tab.label}
              href={couponsHref({ status: tab.value, q, page: 1 })}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  active ? "bg-white/20 text-white" : "bg-canvas text-muted"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <form
        action="/dashboard/coupons"
        className="flex w-full max-w-xl items-center gap-2"
      >
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search coupons</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search code or description"
            className="h-10 w-full rounded-xl border border-line bg-panel pl-10 pr-3.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Search
        </button>
        {hasFilters ? (
          <Link
            href="/dashboard/coupons"
            className="text-sm font-medium text-brand transition hover:text-brand-strong"
          >
            Reset
          </Link>
        ) : null}
      </form>

      {couponsResult.error ? (
        <div className="rounded-3xl border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-semibold text-danger">Could not load coupons</p>
              <p className="mt-1 text-sm leading-6 text-danger/80">
                {couponsResult.error.message}
              </p>
              <p className="mt-2 text-xs leading-5 text-danger/70">
                Confirm migration `0004_admin_roles.sql` is applied and this
                account has the admin role.
              </p>
            </div>
          </div>
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-3xl border border-line bg-panel px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
            <TicketPercent size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No coupons found</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
            {hasFilters
              ? "No coupons match these filters. Try a different code, description, or status."
              : "Create your first promo code to offer a discount at checkout."}
          </p>
          {hasFilters ? (
            <Link
              href="/dashboard/coupons"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-strong"
            >
              Reset filters
              <ArrowRight size={15} />
            </Link>
          ) : (
            <Link
              href="/dashboard/coupons/new"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-strong"
            >
              Create a coupon
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-sm">
          {coupons.map((coupon) => {
            const state = couponState(coupon);
            const minSubtotal = Number(coupon.min_subtotal ?? 0);

            return (
              <Link
                key={coupon.code}
                href={`/dashboard/coupons/${encodeURIComponent(coupon.code)}`}
                className="flex flex-col gap-4 border-b border-line px-4 py-4 transition last:border-b-0 hover:bg-canvas sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                    <TicketPercent size={20} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-semibold tracking-tight">
                        {coupon.code}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${couponStateTone(
                          state
                        )}`}
                      >
                        {couponStateLabel(state)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {coupon.description || "No description"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {couponExpiryLabel(coupon.expires_at)}
                      {minSubtotal > 0
                        ? ` · Min ${formatMoney(minSubtotal)}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pl-[62px] sm:justify-end sm:pl-0">
                  <div className="text-left sm:text-right">
                    <p className="font-semibold">
                      {couponDiscountLabel(coupon)}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-muted">
                      Edit coupon
                    </p>
                  </div>
                  <ArrowRight size={17} className="shrink-0 text-muted" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Showing {firstResult}–{lastResult} of {total} coupons
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={couponsHref({ status, q, page: page - 1 })}
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
                href={couponsHref({ status, q, page: page + 1 })}
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
