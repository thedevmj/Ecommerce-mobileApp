import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Package,
  PackageSearch,
  Plus,
  Search,
  Star,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  CATALOG_PAGE_SIZE,
  formatMoney,
  LOW_STOCK_THRESHOLD,
  productStatusTone,
  stockLevel,
  type CatalogProduct,
  type Category,
} from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Products · Shopcart Admin",
};

type ProductsSearchParams = {
  q?: string | string[];
  status?: string | string[];
  category?: string | string[];
  page?: string | string[];
};

const statuses = [
  { value: null, label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "low", label: "Low stock" },
] as const;

type StatusFilter = (typeof statuses)[number]["value"];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isStatus(value: string | undefined): value is Exclude<StatusFilter, null> {
  return value === "active" || value === "inactive" || value === "low";
}

function productsHref({
  status,
  category,
  q,
  page,
}: {
  status?: StatusFilter;
  category?: string;
  q?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/dashboard/products?${query}` : "/dashboard/products";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}) {
  const params = await searchParams;
  const rawStatus = first(params.status);
  const status = isStatus(rawStatus) ? rawStatus : null;
  const category = first(params.category) ?? "";
  const q = (first(params.q) ?? "").trim().slice(0, 80);
  const search = q.replace(/[%_(),]/g, " ").trim();
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const supabase = await createClient();

  let productsQuery = supabase
    .from("products")
    .select(
      "id, title, slug, price, compare_at_price, stock, image_url, is_active, is_featured, rating, review_count, category_id, updated_at, categories(name, slug)",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false });

  if (status === "active") productsQuery = productsQuery.eq("is_active", true);
  if (status === "inactive") productsQuery = productsQuery.eq("is_active", false);
  if (status === "low") {
    productsQuery = productsQuery
      .eq("is_active", true)
      .lte("stock", LOW_STOCK_THRESHOLD);
  }
  if (category) productsQuery = productsQuery.eq("category_id", category);
  if (search) {
    productsQuery = productsQuery.or(
      `title.ilike.%${search}%,brand.ilike.%${search}%,slug.ilike.%${search}%`
    );
  }

  const [
    productsResult,
    allCountResult,
    activeCountResult,
    inactiveCountResult,
    lowCountResult,
    categoriesResult,
  ] = await Promise.all([
    productsQuery.range(
      (page - 1) * CATALOG_PAGE_SIZE,
      page * CATALOG_PAGE_SIZE - 1
    ),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", false),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .lte("stock", LOW_STOCK_THRESHOLD),
    supabase
      .from("categories")
      .select("id, name, is_active")
      .order("sort_order")
      .order("name"),
  ]);

  const products = (productsResult.data ?? []) as unknown as CatalogProduct[];
  const categories = (categoriesResult.data ?? []) as Pick<
    Category,
    "id" | "name" | "is_active"
  >[];
  const total = productsResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const firstResult = total === 0 ? 0 : (page - 1) * CATALOG_PAGE_SIZE + 1;
  const lastResult = Math.min(page * CATALOG_PAGE_SIZE, total);
  const counts: Record<Exclude<StatusFilter, null>, number> = {
    active: activeCountResult.count ?? 0,
    inactive: inactiveCountResult.count ?? 0,
    low: lowCountResult.count ?? 0,
  };
  const allCount = allCountResult.count ?? 0;
  const hasFilters = Boolean(q || status || category);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage pricing, stock, media, and storefront visibility for every product."
        action={
          <Link
            href="/dashboard/products/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong"
          >
            <Plus size={16} />
            New product
          </Link>
        }
      />

      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-panel p-1.5 shadow-sm">
        {statuses.map((tab) => {
          const active = status === tab.value;
          const count =
            tab.value === null
              ? allCount
              : counts[tab.value];

          return (
            <Link
              key={tab.label}
              href={productsHref({
                status: tab.value,
                category: category || undefined,
                q,
                page: 1,
              })}
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form
          action="/dashboard/products"
          className="flex w-full max-w-xl items-center gap-2"
        >
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {category ? (
            <input type="hidden" name="category" value={category} />
          ) : null}
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search products</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search title, brand, or slug"
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

        <form action="/dashboard/products" className="flex items-center gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {q ? <input type="hidden" name="q" value={q} /> : null}
          <label className="relative">
            <span className="sr-only">Filter by category</span>
            <select
              name="category"
              defaultValue={category}
              className="h-10 rounded-xl border border-line bg-panel px-3.5 pr-8 text-sm shadow-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.is_active ? "" : " (inactive)"}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-xl border border-line bg-panel px-3.5 text-sm font-semibold shadow-sm transition hover:bg-canvas"
          >
            Apply
          </button>
          {hasFilters ? (
            <Link
              href="/dashboard/products"
              className="text-sm font-medium text-brand transition hover:text-brand-strong"
            >
              Reset
            </Link>
          ) : null}
        </form>
      </div>

      {productsResult.error ? (
        <div className="rounded-3xl border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-semibold text-danger">Could not load products</p>
              <p className="mt-1 text-sm leading-6 text-danger/80">
                {productsResult.error.message}
              </p>
              <p className="mt-2 text-xs leading-5 text-danger/70">
                Confirm migration `0004_admin_roles.sql` is applied and this
                account has the admin role.
              </p>
            </div>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-line bg-panel px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
            <PackageSearch size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No products found</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
            {hasFilters
              ? "No products match these filters. Try clearing the search or choosing another category."
              : "Add your first product to start building the catalog."}
          </p>
          {hasFilters ? (
            <Link
              href="/dashboard/products"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-strong"
            >
              Reset filters
              <ArrowRight size={15} />
            </Link>
          ) : (
            <Link
              href="/dashboard/products/new"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-strong"
            >
              Create a product
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-sm">
          {products.map((product) => {
            const stock = stockLevel(product.stock);
            const categoryName = product.categories?.name ?? "Uncategorized";

            return (
              <Link
                key={product.id}
                href={`/dashboard/products/${product.id}`}
                className="flex flex-col gap-4 border-b border-line px-4 py-4 transition last:border-b-0 hover:bg-canvas sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-line bg-canvas">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt=""
                        fill
                        unoptimized
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-muted">
                        <Package size={20} />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold tracking-tight">
                        {product.title}
                      </p>
                      {product.is_featured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                          <Star size={10} />
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {categoryName} · {product.slug}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${productStatusTone(
                          product.is_active
                        )}`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stock.tone}`}
                      >
                        {stock.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pl-[70px] sm:justify-end sm:pl-0">
                  <div className="text-left sm:text-right">
                    <p className="font-semibold">{formatMoney(product.price)}</p>
                    {product.compare_at_price ? (
                      <p className="text-xs text-muted line-through">
                        {formatMoney(product.compare_at_price)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted">
                        {product.review_count} review
                        {product.review_count === 1 ? "" : "s"}
                      </p>
                    )}
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
            Showing {firstResult}–{lastResult} of {total} products
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={productsHref({
                  status,
                  category: category || undefined,
                  q,
                  page: page - 1,
                })}
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
                href={productsHref({
                  status,
                  category: category || undefined,
                  q,
                  page: page + 1,
                })}
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
