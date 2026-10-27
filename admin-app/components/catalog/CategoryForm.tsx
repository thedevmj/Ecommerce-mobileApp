"use client";

import { AlertCircle, ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import {
  createCategory,
  updateCategory,
  type CategoryActionState,
} from "@/app/dashboard/categories/actions";
import type { Category } from "@/lib/catalog";
import ImageUploadField from "./ImageUploadField";

type CategoryFormProps = {
  category?: Category;
};

const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export default function CategoryForm({ category }: CategoryFormProps) {
  const action = category ? updateCategory : createCategory;
  const [state, formAction, pending] = useActionState<
    CategoryActionState,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {category ? (
        <input type="hidden" name="category_id" value={category.id} />
      ) : null}

      {state.error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="leading-6">{state.error}</p>
        </div>
      ) : null}

      {state.ok ? (
        <div className="rounded-2xl border border-success/20 bg-success-soft px-4 py-3 text-sm font-medium text-success">
          Category saved.
        </div>
      ) : null}

      <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold tracking-tight">
          Category details
        </h2>
        <p className="mt-1 text-sm text-muted">
          Categories group products in the storefront navigation and filters.
        </p>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Name</span>
              <input
                name="name"
                required
                maxLength={120}
                defaultValue={category?.name}
                placeholder="Home & living"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Slug</span>
              <input
                name="slug"
                maxLength={160}
                defaultValue={category?.slug}
                placeholder="home-living"
                className={fieldClass}
              />
              <p className="mt-1.5 text-xs text-muted">
                Leave blank to generate it from the name.
              </p>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Icon</span>
              <input
                name="icon"
                maxLength={40}
                defaultValue={category?.icon ?? ""}
                placeholder="shopping-bag"
                className={fieldClass}
              />
              <p className="mt-1.5 text-xs text-muted">
                Optional icon name used by the mobile app.
              </p>
            </label>

            <label className="block">
              <span className={labelClass}>Sort order</span>
              <input
                name="sort_order"
                type="number"
                step="1"
                defaultValue={category?.sort_order ?? 0}
                className={fieldClass}
              />
              <p className="mt-1.5 text-xs text-muted">
                Lower numbers appear first.
              </p>
            </label>
          </div>

          <ImageUploadField
            name="image_url"
            label="Category image"
            hint="Optional banner or tile image."
            defaultValue={category?.image_url}
            folder="categories"
          />

          <label className="flex items-start gap-3 rounded-2xl border border-line bg-canvas p-3.5">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={category?.is_active ?? true}
              className="mt-0.5 h-4 w-4 rounded accent-brand"
            />
            <span>
              <span className="block text-sm font-medium text-ink">Active</span>
              <span className="block text-xs leading-5 text-muted">
                Inactive categories stay in the database but are hidden from
                the app.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {pending ? "Saving" : category ? "Save changes" : "Create category"}
        </button>
        <Link
          href="/dashboard/categories"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-panel px-4 text-sm font-semibold transition hover:bg-canvas"
        >
          <ArrowLeft size={16} />
          Back to categories
        </Link>
      </div>
    </form>
  );
}
