import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ProductForm from "@/components/catalog/ProductForm";
import type { Category } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "New product · Shopcart Admin",
};

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, is_active")
    .order("sort_order")
    .order("name");

  const categories = (data ?? []) as Pick<
    Category,
    "id" | "name" | "is_active"
  >[];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="New product"
        description="Add a product to the storefront with pricing, stock, and media."
      />

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="leading-6">{error.message}</p>
        </div>
      ) : null}

      <ProductForm categories={categories} />
    </div>
  );
}
