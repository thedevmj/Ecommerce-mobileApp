import {
  AlertCircle,
  ArrowLeft,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import OrderStatusForm from "@/components/OrderStatusForm";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  formatOrderDateTime,
  isOrderStatus,
  itemCount,
  parseShippingAddress,
  type Order,
  type OrderStatus,
} from "@/lib/orders";

export const metadata: Metadata = {
  title: "Order details · Shopcart Admin",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-5">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to orders
        </Link>
        <div className="rounded-3xl border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-semibold text-danger">
                Could not load this order
              </p>
              <p className="mt-1 text-sm leading-6 text-danger/80">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) notFound();

  const order = data as Order;
  const status: OrderStatus = isOrderStatus(order.status)
    ? order.status
    : "pending";
  const address = parseShippingAddress(order.shipping_address);
  const items = order.order_items ?? [];
  const quantity = itemCount(order);
  const hasDiscount = Number(order.discount) > 0;
  const hasTax = Number(order.tax) > 0;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        Back to orders
      </Link>

      <PageHeader
        eyebrow="Order details"
        title={order.order_number}
        description={`Placed ${formatOrderDateTime(order.placed_at)} · Cash on delivery`}
        action={<OrderStatusBadge status={status} />}
      />

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr] xl:items-start">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-line bg-panel shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Package size={17} className="text-brand-strong" />
                <h2 className="font-semibold">Items</h2>
              </div>
              <span className="text-xs text-muted">
                {quantity} {quantity === 1 ? "unit" : "units"}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                No order items were recorded.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3.5 px-5 py-4"
                  >
                    {item.image_snapshot ? (
                      <Image
                        src={item.image_snapshot}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 shrink-0 rounded-xl border border-line object-cover"
                      />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-canvas text-muted ring-1 ring-line">
                        <ShoppingBag size={18} />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.title_snapshot}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                      </p>
                    </div>

                    <p className="text-sm font-semibold">
                      {formatCurrency(item.line_total)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2.5">
              <MapPin size={17} className="text-brand-strong" />
              <h2 className="font-semibold">Delivery address</h2>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="min-w-0 text-sm leading-6">
                <p className="flex items-center gap-2 font-medium">
                  <UserRound size={14} className="text-muted" />
                  {address.recipient || "Customer"}
                  {address.label ? (
                    <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted ring-1 ring-line">
                      {address.label}
                    </span>
                  ) : null}
                </p>
                {address.line1 ? <p className="mt-1 text-muted">{address.line1}</p> : null}
                {address.line2 ? <p className="text-muted">{address.line2}</p> : null}
                {address.city || address.state || address.postalCode ? (
                  <p className="text-muted">
                    {[address.city, address.state].filter(Boolean).join(", ")}{" "}
                    {address.postalCode}
                  </p>
                ) : null}
                {address.country ? (
                  <p className="text-muted">{address.country}</p>
                ) : null}
                {!address.line1 && !address.city ? (
                  <p className="mt-1 text-muted">
                    No delivery address was saved for this order.
                  </p>
                ) : null}
              </div>

              {address.phone ? (
                <div className="flex h-fit items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm ring-1 ring-line">
                  <Phone size={14} className="text-muted" />
                  {address.phone}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2.5">
              <ReceiptText size={17} className="text-brand-strong" />
              <h2 className="font-semibold">Update status</h2>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              Currently{" "}
              <span className="font-medium text-ink">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              . The mobile Orders screen reflects changes on its next refresh.
            </p>
            <div className="mt-4">
              <OrderStatusForm
                orderId={order.id}
                status={status}
                previousStatus={order.previous_status}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">Payment summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatCurrency(order.subtotal)}</dd>
              </div>
              {hasDiscount ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">
                    Discount
                    {order.coupon_code ? ` (${order.coupon_code})` : ""}
                  </dt>
                  <dd className="text-success">
                    −{formatCurrency(order.discount)}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Shipping</dt>
                <dd>{formatCurrency(order.shipping)}</dd>
              </div>
              {hasTax ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Tax</dt>
                  <dd>{formatCurrency(order.tax)}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4 border-t border-line pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatCurrency(order.total)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm">
              <span className="font-medium text-accent">Payment method</span>
              <span className="font-semibold text-accent">Cash on delivery</span>
            </div>

            {order.notes ? (
              <div className="mt-4 rounded-xl border border-line bg-canvas px-3.5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Order notes
                </p>
                <p className="mt-1 text-sm leading-6">{order.notes}</p>
              </div>
            ) : null}
          </section>

          <p className="px-1 text-xs leading-5 text-muted">
            Last updated {formatOrderDateTime(order.updated_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
