import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Search,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { formatMoney } from "@/lib/catalog";
import {
  CUSTOMERS_PAGE_SIZE,
  customerInitial,
  customerName,
  fetchCustomerDirectory,
} from "@/lib/customers";
import { formatOrderDate } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Customers | Shopcart Admin",
};

type CustomersSearchParams = {
  q?: string | string[];
  page?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function customersHref({ q, page }: { q?: string; page?: number }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/dashboard/customers?${query}` : "/dashboard/customers";
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<CustomersSearchParams>;
}) {
  const params = await searchParams;
  const q = (first(params.q) ?? "").trim().slice(0, 80);
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [directory, newCustomersResult] = await Promise.all([
    fetchCustomerDirectory(supabase, { search: q, page }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString()),
  ]);

  const customers = directory.customers;
  const total = directory.total;
  const totalPages = Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE));
  const firstResult = total === 0 ? 0 : (page - 1) * CUSTOMERS_PAGE_SIZE + 1;
  const lastResult = Math.min(page * CUSTOMERS_PAGE_SIZE, total);
  const pageOrders = customers.reduce(
    (sum, customer) => sum + Number(customer.order_count ?? 0),
    0
  );
  const pageValue = customers.reduce(
    (sum, customer) => sum + Number(customer.total_spent ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customers"
        title="Customers"
        description="Find customers, review their contact details, and open their order history."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Customers
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{total}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            New this month
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {newCustomersResult.count ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Orders on this page
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {pageOrders}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Lifetime value on this page
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {formatMoney(pageValue)}
          </p>
        </div>
      </div>

      <form
        action="/dashboard/customers"
        className="flex w-full max-w-xl items-center gap-2"
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search customers</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, or phone"
            className="h-10 w-full rounded-xl border border-line bg-panel pl-10 pr-3.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Search
        </button>
        {q ? (
          <Link
            href="/dashboard/customers"
            className="text-sm font-medium text-brand transition hover:text-brand-strong"
          >
            Reset
          </Link>
        ) : null}
      </form>

      {!directory.emailAvailable ? (
        <div className="rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm leading-6 text-warning">
          Email addresses and email search are available after applying{" "}
          <span className="font-semibold">`0006_customer_directory.sql`</span>.
          Until then, search matches names and phone numbers.
        </div>
      ) : null}

      {directory.error ? (
        <div className="rounded-3xl border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-semibold text-danger">
                Could not load customers
              </p>
              <p className="mt-1 text-sm leading-6 text-danger/80">
                {directory.error}
              </p>
              <p className="mt-2 text-xs leading-5 text-danger/70">
                Confirm migration `0004_admin_roles.sql` is applied and this
                account has the admin role.
              </p>
            </div>
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-3xl border border-line bg-panel px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
            <Users size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No customers found</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
            {q
              ? "No customers match this search. Try a different name, email, or phone number."
              : "Customers appear here after they create an account in the mobile app."}
          </p>
          {q ? (
            <Link
              href="/dashboard/customers"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-strong"
            >
              Reset search
              <ArrowRight size={15} />
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-sm">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/dashboard/customers/${customer.id}`}
              className="flex flex-col gap-4 border-b border-line px-4 py-4 transition last:border-b-0 hover:bg-canvas sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-base font-semibold text-brand-strong">
                  {customerInitial(customer)}
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold tracking-tight">
                      {customerName(customer)}
                    </p>
                    {customer.role === "admin" ? (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        Admin
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {customer.email ? (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <Mail size={12} className="shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </span>
                    ) : null}
                    {customer.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} className="shrink-0" />
                        {customer.phone}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                    <CalendarDays size={12} />
                    Joined {formatOrderDate(customer.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-6 pl-[62px] sm:justify-end sm:pl-0">
                <div className="text-left sm:text-right">
                  <p className="font-semibold">
                    {formatMoney(customer.total_spent)}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
                    <ShoppingBag size={12} />
                    {customer.order_count} order
                    {Number(customer.order_count) === 1 ? "" : "s"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {customer.last_order_at
                      ? `Last ${formatOrderDate(customer.last_order_at)}`
                      : "No orders yet"}
                  </p>
                </div>
                <ArrowRight size={17} className="shrink-0 text-muted" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Showing {firstResult}–{lastResult} of {total} customers
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={customersHref({ q, page: page - 1 })}
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
                href={customersHref({ q, page: page + 1 })}
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
