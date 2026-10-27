import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ConfirmDeleteForm from "@/components/catalog/ConfirmDeleteForm";
import ProductForm from "@/components/catalog/ProductForm";
import type { CatalogProduct, Category } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "../actions";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("title")
    .eq("id", id)
    .maybeSingle();

  return {
    title: data?.title
      ? `${data.title} · Shopcart Admin`
      : "Product · Shopcart Admin",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [productResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name, is_active")
      .order("sort_order")
      .order("name"),
  ]);

  if (productResult.error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Catalog"
          title="Product"
          description="Update pricing, stock, media, and storefront visibility."
        />
        <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="leading-6">{productResult.error.message}</p>
        </div>
      </div>
    );
  }

  if (!productResult.data) notFound();

  const product = productResult.data as CatalogProduct;
  const categories = (categoriesResult.data ?? []) as Pick<
    Category,
    "id" | "name" | "is_active"
  >[];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title={product.title}
        description={`Editing ${product.slug}. Changes appear in the mobile app after its next refresh.`}
        action={
          <Link
            href="/dashboard/products"
            className="inline-flex h-10 items-center rounded-xl border border-line bg-panel px-4 text-sm font-semibold shadow-sm transition hover:bg-canvas"
          >
            All products
          </Link>
        }
      />

      <ProductForm categories={categories} product={product} />

      <section className="max-w-3xl rounded-3xl border border-danger/20 bg-danger-soft/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight text-danger">
          Delete product
        </h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
          This removes the product, its gallery, reviews, and favorites. Order
          history keeps its item snapshots, so past orders are not changed.
        </p>
        <div className="mt-4">
          <ConfirmDeleteForm
            action={deleteProduct}
            idName="product_id"
            id={product.id}
            message={`Delete ${product.title}? This cannot be undone.`}
            label="Delete product"
          />
        </div>
      </section>
    </div>
  );
}
