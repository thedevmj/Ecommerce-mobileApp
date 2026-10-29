import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Search,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import EnquiryStatusBadge from "@/components/enquiries/EnquiryStatusBadge";
import PageHeader from "@/components/PageHeader";
import {
  ENQUIRIES_PAGE_SIZE,
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_META,
  enquiryAuthor,
  enquiryInitial,
  formatEnquiryDateTime,
  isEnquiryStatus,
  type Enquiry,
  type EnquiryStatus,
} from "@/lib/enquiries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Enquiries · Shopcart Admin",
};

type EnquiriesSearchParams = {
  q?: string | string[];
  status?: string | string[];
  page?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function enquiriesHref({
  status,
  q,
  page,
}: {
  status?: EnquiryStatus | null;
  q?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/dashboard/enquiries?${query}` : "/dashboard/enquiries";
}

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<EnquiriesSearchParams>;
}) {
  const params = await searchParams;
  const rawStatus = first(params.status);
  const status = isEnquiryStatus(rawStatus) ? rawStatus : null;
  const q = (first(params.q) ?? "").trim().slice(0, 80);
  const search = q.replace(/[%_(),]/g, " ").trim();
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const supabase = await createClient();

  let enquiriesQuery = supabase
    .from("enquiries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) enquiriesQuery = enquiriesQuery.eq("status", status);
  if (search) {
    enquiriesQuery = enquiriesQuery.or(
      `subject.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`
    );
  }

  const [enquiriesResult, allCountResult, statusCounts] = await Promise.all([
    enquiriesQuery.range(
      (page - 1) * ENQUIRIES_PAGE_SIZE,
      page * ENQUIRIES_PAGE_SIZE - 1
    ),
    supabase.from("enquiries").select("id", { count: "exact", head: true }),
    Promise.all(
      ENQUIRY_STATUSES.map(async (value) => {
        const { count } = await supabase
          .from("enquiries")
          .select("id", { count: "exact", head: true })
          .eq("status", value);

        return [value, count ?? 0] as const;
      })
    ),
  ]);

  const enquiries = (enquiriesResult.data ?? []) as Enquiry[];
  const total = enquiriesResult.count ?? 0;
  const allCount = allCountResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ENQUIRIES_PAGE_SIZE));
  const statusCountMap = new Map<EnquiryStatus, number>(statusCounts);
  const firstResult = total === 0 ? 0 : (page - 1) * ENQUIRIES_PAGE_SIZE + 1;
  const lastResult = Math.min(page * ENQUIRIES_PAGE_SIZE, total);
  const hasFilters = Boolean(q || status);

  const tabs = [
    { value: null, label: "All", count: allCount },
    ...ENQUIRY_STATUSES.map((value) => ({
      value,
      label: ENQUIRY_STATUS_META[value].label,
      count: statusCountMap.get(value) ?? 0,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="Enquiries"
        description="Read customer messages, update their status, and reply from the mobile app's support history."
        action={
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-2 text-xs font-semibold text-brand-strong">
            <MessageSquare size={14} />
            {allCount} total
          </span>
        }
      />

      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-panel p-1.5 shadow-sm">
        {tabs.map((tab) => {
          const active = status === tab.value;

          return (
            <Link
              key={tab.label}
              href={enquiriesHref({ status: tab.value, q, page: 1 })}
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
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          action="/dashboard/enquiries"
          className="flex w-full max-w-lg items-center gap-2"
        >
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">
              Search enquiries by subject, name, email, or message
            </span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search subject, name, email, or message"
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
            href="/dashboard/enquiries"
            className="text-sm font-medium text-brand transition hover:text-brand-strong"
          >
            Reset filters
          </Link>
        ) : null}
      </div>

      {enquiriesResult.error ? (
        <div className="rounded-3xl border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-semibold text-danger">
                Could not load enquiries
              </p>
              <p className="mt-1 text-sm leading-6 text-danger/80">
                {enquiriesResult.error.message}
              </p>
              <p className="mt-2 text-xs leading-5 text-danger/70">
                Apply migration `0008_enquiries.sql` and confirm this account has
                the admin role.
              </p>
            </div>
          </div>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="rounded-3xl border border-line bg-panel px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
            <MessageSquare size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No enquiries found</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
            {hasFilters
              ? "No enquiries match this search and status. Try clearing the filters."
              : "Messages sent from the mobile Help & enquiries screen will appear here."}
          </p>
          {hasFilters ? (
            <Link
              href="/dashboard/enquiries"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-strong"
            >
              Reset filters
              <ArrowRight size={15} />
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-sm">
          {enquiries.map((enquiry) => {
            const author = enquiryAuthor(enquiry);

            return (
              <div
                key={enquiry.id}
                className="border-b border-line last:border-b-0"
              >
                <Link
                  href={`/dashboard/enquiries/${enquiry.id}`}
                  className="flex flex-col gap-3 px-4 py-4 transition hover:bg-canvas sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">
                      {enquiryInitial(enquiry)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold tracking-tight">
                        {enquiry.subject}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted">
                        {author}
                        {enquiry.email ? ` · ${enquiry.email}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatEnquiryDateTime(enquiry.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 pl-13 sm:justify-end sm:pl-0">
                    {enquiry.admin_reply ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                        Replied
                      </span>
                    ) : null}
                    <EnquiryStatusBadge status={enquiry.status} />
                    <ArrowRight size={17} className="text-muted" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Showing {firstResult}–{lastResult} of {total} enquiries
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={enquiriesHref({ status, q, page: page - 1 })}
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
                href={enquiriesHref({ status, q, page: page + 1 })}
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
