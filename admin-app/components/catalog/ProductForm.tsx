"use client";

import { AlertCircle, ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import type { CatalogProduct, Category } from "@/lib/catalog";
import {
  createProduct,
  updateProduct,
  type CatalogActionState,
} from "@/app/dashboard/products/actions";
import ImageUploadField from "./ImageUploadField";
import ProductGalleryField from "./ProductGalleryField";

type ProductFormProps = {
  categories: Pick<Category, "id" | "name" | "is_active">[];
  product?: CatalogProduct;
};

const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export default function ProductForm({
  categories,
  product,
}: ProductFormProps) {
  const action = product ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState<
    CatalogActionState,
    FormData
  >(action, {});
  const gallery = [...(product?.product_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((image) => image.url);

  return (
    <form action={formAction} className="space-y-6">
      {product ? (
        <input type="hidden" name="product_id" value={product.id} />
      ) : null}

      {state.error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="leading-6">{state.error}</p>
        </div>
      ) : null}

      {state.ok ? (
        <div className="rounded-2xl border border-success/20 bg-success-soft px-4 py-3 text-sm font-medium text-success">
          Product saved.
        </div>
      ) : null}

      {!categories.length ? (
        <div className="rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning">
          Create a category first before adding products.{" "}
          <Link
            href="/dashboard/categories/new"
            className="font-semibold underline underline-offset-2"
          >
            Add a category
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold tracking-tight">
                Product details
              </h2>
              <p className="mt-1 text-sm text-muted">
                The name, category, and copy customers see in the app.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className={labelClass}>Title</span>
                <input
                  name="title"
                  required
                  maxLength={160}
                  defaultValue={product?.title}
                  placeholder="Everyday cotton tote"
                  className={fieldClass}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Slug</span>
                  <input
                    name="slug"
                    maxLength={160}
                    defaultValue={product?.slug}
                    placeholder="everyday-cotton-tote"
                    className={fieldClass}
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    Leave blank to generate it from the title.
                  </p>
                </label>

                <label className="block">
                  <span className={labelClass}>Category</span>
                  <select
                    name="category_id"
                    required
                    defaultValue={product?.category_id ?? ""}
                    className={fieldClass}
                  >
                    <option value="" disabled>
                      Choose a category
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                        {category.is_active ? "" : " (inactive)"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Brand</span>
                <input
                  name="brand"
                  maxLength={80}
                  defaultValue={product?.brand ?? ""}
                  placeholder="Shopcart Studio"
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Description</span>
                <textarea
                  name="description"
                  required
                  rows={8}
                  maxLength={5000}
                  defaultValue={product?.description}
                  placeholder="Describe the product, materials, fit, and anything customers should know."
                  className="w-full rounded-2xl border border-line bg-canvas px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold tracking-tight">Media</h2>
              <p className="mt-1 text-sm text-muted">
                Upload files to the catalog bucket or paste hosted image URLs.
              </p>
            </div>

            <div className="space-y-6">
              <ImageUploadField
                name="image_url"
                label="Primary image"
                hint="Used in listings, cards, and search results."
                defaultValue={product?.image_url}
                folder="products"
              />
              <ProductGalleryField defaultValue={gallery} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold tracking-tight">
              Pricing & inventory
            </h2>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className={labelClass}>Price</span>
                <input
                  name="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  defaultValue={
                    product ? Number(product.price).toFixed(2) : ""
                  }
                  placeholder="0.00"
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Compare-at price</span>
                <input
                  name="compare_at_price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    product?.compare_at_price
                      ? Number(product.compare_at_price).toFixed(2)
                      : ""
                  }
                  placeholder="Optional"
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Stock</span>
                <input
                  name="stock"
                  type="number"
                  required
                  min="0"
                  step="1"
                  defaultValue={product?.stock ?? 0}
                  className={fieldClass}
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold tracking-tight">
              Visibility
            </h2>
            <p className="mt-1 text-sm text-muted">
              Inactive products stay in the database but are hidden from the
              mobile app.
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 rounded-2xl border border-line bg-canvas p-3.5">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={product?.is_active ?? true}
                  className="mt-0.5 h-4 w-4 rounded accent-brand"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    Active
                  </span>
                  <span className="block text-xs leading-5 text-muted">
                    Show this product in the app and allow checkout.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-line bg-canvas p-3.5">
                <input
                  type="checkbox"
                  name="is_featured"
                  defaultChecked={product?.is_featured ?? false}
                  className="mt-0.5 h-4 w-4 rounded accent-brand"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    Featured
                  </span>
                  <span className="block text-xs leading-5 text-muted">
                    Surface this product in featured collections.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={pending || !categories.length}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {pending ? "Saving" : product ? "Save changes" : "Create product"}
              </button>
              <Link
                href="/dashboard/products"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-panel px-4 text-sm font-semibold transition hover:bg-canvas"
              >
                <ArrowLeft size={16} />
                Back to products
              </Link>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
