import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CategoryForm from "@/components/catalog/CategoryForm";

export const metadata: Metadata = {
  title: "New category · Shopcart Admin",
};

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="New category"
        description="Create a group for products in the storefront navigation and filters."
      />
      <CategoryForm />
    </div>
  );
}
