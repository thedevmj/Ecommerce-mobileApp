import {
  ArrowRight,
  CircleDollarSign,
  FolderTree,
  MessageSquare,
  MessagesSquare,
  Package,
  PackageSearch,
  ShoppingBag,
  TicketPercent,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { formatMoney, LOW_STOCK_THRESHOLD } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    ordersToday,
    deliveredRevenue,
    lowStock,
    customers,
    pendingOrders,
    openEnquiries,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("placed_at", startOfToday.toISOString()),
    supabase
      .from("orders")
      .select("total.sum()")
      .eq("status", "delivered")
      .then(async ({ data, error }) => {
        const aggregate = Array.isArray(data) ? data[0] : null;

        if (!error && aggregate && typeof aggregate === "object") {
          return Number(aggregate.sum ?? 0);
        }

        const { data: orders } = await supabase
          .from("orders")
          .select("total")
          .eq("status", "delivered");

        return (orders ?? []).reduce(
          (sum: number, order: { total: number | string | null }) =>
            sum + Number(order.total ?? 0),
          0
        );
      }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .lte("stock", LOW_STOCK_THRESHOLD),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  const revenue = deliveredRevenue;
  const pending = pendingOrders.count ?? 0;

  const stats = [
    {
      label: "Revenue",
      value: formatMoney(revenue),
      hint: "Delivered cash-on-delivery orders.",
      icon: CircleDollarSign,
    },
    {
      label: "Orders today",
      value: ordersToday.count ?? 0,
      hint: "Orders placed since midnight.",
      icon: ShoppingBag,
    },
    {
      label: "Low stock",
      value: lowStock.count ?? 0,
      hint: `Active products at ${LOW_STOCK_THRESHOLD} units or fewer.`,
      icon: TriangleAlert,
    },
    {
      label: "Customers",
      value: customers.count ?? 0,
      hint: "Registered customer profiles.",
      icon: Users,
    },
    {
      label: "Open enquiries",
      value: openEnquiries.count ?? 0,
      hint: "Customer messages awaiting a reply.",
      icon: MessagesSquare,
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Overview"
        title="Store operations"
        description="A live snapshot of the Shopcart store with the tools to process orders, manage the catalog, and support customers."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-line bg-panel p-6 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                Live workspace
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Orders are ready to process
              </h2>
              <p className="mt-1.5 max-w-lg text-sm leading-6 text-muted">
                Search and filter cash-on-delivery orders, open the full order
                details, and move each order through pending, processing,
                shipped, and delivered.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                pending > 0
                  ? "bg-warning-soft text-warning"
                  : "bg-success-soft text-success"
              }`}
            >
              {pending > 0 ? `${pending} pending` : "Live"}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["01", "Filter and search", "Find orders by status or order number."],
              ["02", "Review details", "See items, totals, and the delivery snapshot."],
              ["03", "Update status", "Move orders forward as they are fulfilled."],
            ].map(([step, title, detail]) => (
              <div
                key={step}
                className="rounded-2xl border border-line bg-canvas p-4"
              >
                <p className="text-xs font-semibold text-brand">{step}</p>
                <p className="mt-2 text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
              </div>
            ))}
          </div>

          <Link
            href="/dashboard/orders"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-strong"
          >
            Open orders workspace
            <ArrowRight size={16} />
          </Link>
        </section>

        <section className="rounded-3xl border border-line bg-panel p-6 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-strong">
              <PackageSearch size={20} />
            </span>
            <div>
              <h2 className="text-base font-semibold">Admin tools are live</h2>
              <p className="text-xs text-muted">Phase 5 complete</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {[
              {
                href: "/dashboard/products",
                label: "Products",
                detail: "Pricing, stock, media, and visibility",
                icon: Package,
              },
              {
                href: "/dashboard/categories",
                label: "Categories",
                detail: "Storefront groups and sort order",
                icon: FolderTree,
              },
              {
                href: "/dashboard/customers",
                label: "Customers",
                detail: "Contact details and order history",
                icon: Users,
              },
              {
                href: "/dashboard/coupons",
                label: "Coupons",
                detail: "Promo codes, discounts, and expiry",
                icon: TicketPercent,
              },
              {
                href: "/dashboard/reviews",
                label: "Reviews",
                detail: "Read feedback and remove bad reviews",
                icon: MessageSquare,
              },
              {
                href: "/dashboard/enquiries",
                label: "Enquiries",
                detail: "Reply to customer support messages",
                icon: MessagesSquare,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-canvas p-3 transition hover:border-brand/30 hover:bg-panel"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-panel text-brand shadow-sm">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {item.detail}
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-muted" />
                </Link>
              );
            })}
          </div>

          <p className="mt-4 text-xs leading-5 text-muted">
            Apply `0005_catalog_storage.sql` for uploads,
            `0006_customer_directory.sql` for customer email search, and
            `0008_enquiries.sql` for the enquiries inbox.
          </p>
        </section>
      </div>
    </div>
  );
}
