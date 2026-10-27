import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import CategoryForm from "@/components/catalog/CategoryForm";
import ConfirmDeleteForm from "@/components/catalog/ConfirmDeleteForm";
import type { Category } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { deleteCategory } from "../actions";

type CategoryPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return {
    title: data?.name
      ? `${data.name} · Shopcart Admin`
      : "Category · Shopcart Admin",
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Catalog"
          title="Category"
          description="Organize products and control their storefront order."
        />
        <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="leading-6">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) notFound();

  const category = data as Category;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title={category.name}
        description={`Editing ${category.slug}. Changes appear in the mobile app after its next refresh.`}
        action={
          <Link
            href="/dashboard/categories"
            className="inline-flex h-10 items-center rounded-xl border border-line bg-panel px-4 text-sm font-semibold shadow-sm transition hover:bg-canvas"
          >
            All categories
          </Link>
        }
      />

      <CategoryForm category={category} />

      <section className="max-w-3xl rounded-3xl border border-danger/20 bg-danger-soft/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight text-danger">
          Delete category
        </h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
          Categories can only be deleted when they contain no products. Move
          products to another category first, or mark this category inactive.
        </p>
        <div className="mt-4">
          <ConfirmDeleteForm
            action={deleteCategory}
            idName="category_id"
            id={category.id}
            message={`Delete ${category.name}? This cannot be undone.`}
            label="Delete category"
          />
        </div>
      </section>
    </div>
  );
}
