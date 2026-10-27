import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Search,
  ShoppingBag,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import OrderStatusQuickForm from "@/components/OrderStatusQuickForm";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  formatOrderDate,
  isOrderStatus,
  itemCount,
  ORDER_STATUS_META,
  parseShippingAddress,
  PRIMARY_STATUSES,
  type Order,
  type OrderStatus,
} from "@/lib/orders";

export const metadata: Metadata = {
  title: "Orders · Shopcart Admin",
};

const PAGE_SIZE = 12;

type OrdersSearchParams = {
  q?: string | string[];
  status?: string | string[];
  page?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function ordersHref({
  status,
  q,
  page,
}: {
  status?: OrderStatus | null;
  q?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/dashboard/orders?${query}` : "/dashboard/orders";
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const params = await searchParams;
  const rawStatus = first(params.status);
  const status = isOrderStatus(rawStatus) ? rawStatus : null;
  const q = (first(params.q) ?? "").trim().slice(0, 80);
  const search = q.replace(/[%_(),]/g, " ").trim();
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const supabase = await createClient();

  let ordersQuery = supabase
    .from("orders")
    .select("*, order_items(*)", { count: "exact" })
    .order("placed_at", { ascending: false });

  if (status) ordersQuery = ordersQuery.eq("status", status);
  if (search) ordersQuery = ordersQuery.ilike("order_number", `%${search}%`);

  const [ordersResult, allCountResult, statusCounts] = await Promise.all([
    ordersQuery.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    Promise.all(
      PRIMARY_STATUSES.map(async (value) => {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", value);

        return [value, count ?? 0] as const;
      })
    ),
  ]);

  const orders = (ordersResult.data ?? []) as Order[];
  const total = ordersResult.count ?? 0;
  const allCount = allCountResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statusCountMap = new Map<OrderStatus, number>(statusCounts);
  const firstResult = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(page * PAGE_SIZE, total);

  const tabs = [
    { value: null, label: "All", count: allCount },
    ...PRIMARY_STATUSES.map((value) => ({
      value,
      label: ORDER_STATUS_META[value].label,
      count: statusCountMap.get(value) ?? 0,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Process cash-on-delivery orders, review delivery details, and move each order through fulfilment."
        action={
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-2 text-xs font-semibold text-accent">
            <ShoppingBag size={14} />
            Cash on delivery
          </span>
        }
      />

      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-panel p-1.5 shadow-sm">
        {tabs.map((tab) => {
          const active = status === tab.value;

          return (
            <Link
              key={tab.label}
              href={ordersHref({ status: tab.value, q, page: 1 })}
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
          action="/dashboard/orders"
          className="flex w-full max-w-lg items-center gap-2"
        >
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search by order number</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by order number"
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

        {q ? (
          <Link
            href={ordersHref({ status })}
            className="text-sm font-medium text-brand transition hover:text-brand-strong"
          >
            Clear search
          </Link>
        ) : null}
      </div>

      {ordersResult.error ? (
        <div className="rounded-3xl border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-semibold text-danger">
                Could not load orders
              </p>
              <p className="mt-1 text-sm leading-6 text-danger/80">
                {ordersResult.error.message}
              </p>
              <p className="mt-2 text-xs leading-5 text-danger/70">
                Confirm migration `0004_admin_roles.sql` is applied and this
                account has the admin role.
              </p>
            </div>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-line bg-panel px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
            <PackageSearch size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No orders found</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
            {q || status
              ? "No orders match this search and status. Try clearing the filters."
              : "Orders placed in the mobile app will appear here."}
          </p>
          {q || status ? (
            <Link
              href="/dashboard/orders"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-strong"
            >
              Reset filters
              <ArrowRight size={15} />
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-sm">
          {orders.map((order) => {
            const address = parseShippingAddress(order.shipping_address);
            const count = itemCount(order);

            return (
              <div
                key={order.id}
                className="border-b border-line last:border-b-0"
              >
                <div className="flex flex-col gap-4 px-4 py-4 transition hover:bg-canvas sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold tracking-tight">
                        {order.order_number}
                      </p>
                      <span className="lg:hidden">
                        <OrderStatusBadge status={order.status} />
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">
                      {address.recipient || "Customer"}
                      {address.city ? ` · ${address.city}` : ""}
                      {address.phone ? ` · ${address.phone}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatOrderDate(order.placed_at)} · {count}{" "}
                      {count === 1 ? "item" : "items"}
                    </p>
                  </Link>

                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <span className="hidden lg:inline-flex">
                      <OrderStatusBadge status={order.status} />
                    </span>
                    <OrderStatusQuickForm
                      orderId={order.id}
                      status={order.status}
                      previousStatus={order.previous_status}
                    />
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      aria-label={`View order ${order.order_number}`}
                      className="flex items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:text-right"
                    >
                      <div>
                        <p className="font-semibold">
                          {formatCurrency(order.total)}
                        </p>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                          COD
                        </p>
                      </div>
                      <ArrowRight size={17} className="shrink-0 text-muted" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Showing {firstResult}–{lastResult} of {total} orders
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={ordersHref({ status, q, page: page - 1 })}
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
                href={ordersHref({ status, q, page: page + 1 })}
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
