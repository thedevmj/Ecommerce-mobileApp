import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Mail,
  Phone,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import PageHeader from "@/components/PageHeader";
import { formatMoney } from "@/lib/catalog";
import {
  customerInitial,
  customerName,
  fetchCustomerDetail,
  fetchCustomerOrders,
} from "@/lib/customers";
import {
  formatOrderDate,
  formatOrderDateTime,
  isOrderStatus,
} from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Customer | Shopcart Admin",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [detail, ordersResult] = await Promise.all([
    fetchCustomerDetail(supabase, id),
    fetchCustomerOrders(supabase, id),
  ]);

  if (detail.error) {
    return (
      <div className="space-y-5">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to customers
        </Link>
        <div className="rounded-3xl border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-semibold text-danger">
                Could not load this customer
              </p>
              <p className="mt-1 text-sm leading-6 text-danger/80">
                {detail.error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!detail.customer) notFound();

  const customer = detail.customer;
  const orders = ordersResult.orders;
  const lifetimeValue = Number(customer.total_spent ?? 0);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        Back to customers
      </Link>

      <PageHeader
        eyebrow="Customer profile"
        title={customerName(customer)}
        description="Contact details, lifetime value, and every order placed by this customer."
      />

      {!detail.emailAvailable ? (
        <div className="rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm leading-6 text-warning">
          Email addresses are available after applying{" "}
          <span className="font-semibold">`0006_customer_directory.sql`</span>.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_1.65fr] xl:items-start">
        <div className="space-y-5">
          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3.5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-soft text-lg font-semibold text-brand-strong">
                {customerInitial(customer)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-tight">
                  {customerName(customer)}
                </p>
                <p className="text-xs capitalize text-muted">
                  {customer.role ?? "customer"}
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Mail size={15} className="mt-0.5 shrink-0 text-muted" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted">Email</dt>
                  <dd className="truncate">
                    {customer.email || "Not available"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone size={15} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <dt className="text-xs text-muted">Phone</dt>
                  <dd>{customer.phone || "Not saved"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CalendarDays size={15} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <dt className="text-xs text-muted">Joined</dt>
                  <dd>{formatOrderDate(customer.created_at)}</dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">Customer value</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-canvas p-3.5">
                <p className="text-xs text-muted">Orders</p>
                <p className="mt-1 text-xl font-semibold">
                  {customer.order_count}
                </p>
              </div>
              <div className="rounded-2xl bg-canvas p-3.5">
                <p className="text-xs text-muted">Lifetime value</p>
                <p className="mt-1 text-xl font-semibold">
                  {formatMoney(lifetimeValue)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              Lifetime value excludes cancelled and refunded orders. Last order:{" "}
              {customer.last_order_at
                ? formatOrderDateTime(customer.last_order_at)
                : "none yet"}
              .
            </p>
          </section>
        </div>

        <section className="overflow-hidden rounded-3xl border border-line bg-panel shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="flex items-center gap-2.5">
              <ReceiptText size={17} className="text-brand-strong" />
              <h2 className="font-semibold">Order history</h2>
            </div>
            <span className="text-xs text-muted">
              {orders.length} order{orders.length === 1 ? "" : "s"}
            </span>
          </div>

          {ordersResult.error ? (
            <p className="px-5 py-8 text-sm text-danger">
              {ordersResult.error}
            </p>
          ) : orders.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                <ShoppingBag size={20} />
              </span>
              <p className="mt-3 font-semibold">No orders yet</p>
              <p className="mt-1 text-sm text-muted">
                Orders placed by this customer will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {orders.map((order) => {
                const status = isOrderStatus(order.status)
                  ? order.status
                  : "pending";
                const count = (order.order_items ?? []).reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );

                return (
                  <li key={order.id}>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="flex flex-col gap-3 px-5 py-4 transition hover:bg-canvas sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold tracking-tight">
                            {order.order_number}
                          </p>
                          <OrderStatusBadge status={status} />
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {formatOrderDateTime(order.placed_at)} · {count}{" "}
                          {count === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <p className="font-semibold">
                          {formatMoney(order.total)}
                        </p>
                        <ArrowRight size={16} className="text-muted" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
