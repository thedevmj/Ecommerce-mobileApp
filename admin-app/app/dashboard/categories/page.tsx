import {
  AlertCircle,
  ArrowRight,
  FolderTree,
  Layers,
  Plus,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  productStatusTone,
  type Category,
} from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Categories · Shopcart Admin",
};

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("name"),
    supabase.from("products").select("category_id"),
  ]);

  const categories = (categoriesResult.data ?? []) as Category[];
  const productCounts = new Map<string, number>();

  for (const product of productsResult.data ?? []) {
    productCounts.set(
      product.category_id,
      (productCounts.get(product.category_id) ?? 0) + 1
    );
  }

  const totalProducts = productsResult.data?.length ?? 0;
  const activeCategories = categories.filter((item) => item.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Organize the storefront into browsable groups and control their order."
        action={
          <Link
            href="/dashboard/categories/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong"
          >
            <Plus size={16} />
            New category
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Categories
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {categories.length}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Active
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {activeCategories}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Products grouped
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {totalProducts}
          </p>
        </div>
      </div>

      {categoriesResult.error ? (
        <div className="rounded-3xl border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-semibold text-danger">
                Could not load categories
              </p>
              <p className="mt-1 text-sm leading-6 text-danger/80">
                {categoriesResult.error.message}
              </p>
              <p className="mt-2 text-xs leading-5 text-danger/70">
                Confirm migration `0004_admin_roles.sql` is applied and this
                account has the admin role.
              </p>
            </div>
          </div>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-3xl border border-line bg-panel px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
            <FolderTree size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No categories yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
            Create a category before adding products to the catalog.
          </p>
          <Link
            href="/dashboard/categories/new"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-strong"
          >
            Create a category
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-sm">
          {categories.map((category) => {
            const count = productCounts.get(category.id) ?? 0;

            return (
              <Link
                key={category.id}
                href={`/dashboard/categories/${category.id}`}
                className="flex flex-col gap-4 border-b border-line px-4 py-4 transition last:border-b-0 hover:bg-canvas sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-line bg-canvas">
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt=""
                        fill
                        unoptimized
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-muted">
                        <FolderTree size={19} />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold tracking-tight">
                        {category.name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${productStatusTone(
                          category.is_active
                        )}`}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {category.slug}
                      {category.icon ? ` · ${category.icon}` : ""}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                      <Layers size={12} />
                      {count} product{count === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pl-[62px] sm:justify-end sm:pl-0">
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Sort order
                    </p>
                    <p className="font-semibold">{category.sort_order}</p>
                  </div>
                  <ArrowRight size={17} className="shrink-0 text-muted" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
