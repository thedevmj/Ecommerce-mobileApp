"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin";
import {
  isValidImageUrl,
  parseGallery,
  slugify,
} from "@/lib/catalog";

export type CatalogActionState = {
  ok?: boolean;
  error?: string;
};

type ProductInput = {
  category_id: string;
  title: string;
  slug: string;
  description: string;
  brand: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  gallery: string[];
};

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function parseProductForm(
  formData: FormData
): { error: string } | { data: ProductInput } {
  const title = text(formData, "title", 160);
  const rawSlug = text(formData, "slug", 160);
  const slug = slugify(rawSlug || title);
  const categoryId = text(formData, "category_id", 80);
  const description = text(formData, "description", 5000);
  const brand = text(formData, "brand", 80) || null;
  const imageUrl = text(formData, "image_url", 2048) || null;
  const price = Number(text(formData, "price", 40));
  const compareRaw = text(formData, "compare_at_price", 40);
  const compareAt = compareRaw ? Number(compareRaw) : null;
  const stock = Number(text(formData, "stock", 20));
  const gallery = parseGallery(String(formData.get("gallery") ?? ""));

  if (!title) return { error: "Add a product title." };
  if (!slug) return { error: "Add a URL slug." };
  if (!categoryId) return { error: "Choose a category." };
  if (!description) return { error: "Add a product description." };
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Enter a valid price." };
  }
  if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt < price)) {
    return {
      error: "The compare-at price must be greater than or equal to the price.",
    };
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "Stock must be a whole number of zero or more." };
  }
  if (imageUrl && !isValidImageUrl(imageUrl)) {
    return { error: "Enter a valid primary image URL." };
  }
  if (gallery.some((url) => !isValidImageUrl(url))) {
    return { error: "Every gallery image must be a valid URL." };
  }

  return {
    data: {
      category_id: categoryId,
      title,
      slug,
      description,
      brand,
      price,
      compare_at_price: compareAt,
      stock,
      image_url: imageUrl,
      is_featured: formData.get("is_featured") === "on",
      is_active: formData.get("is_active") === "on",
      gallery,
    },
  };
}

async function syncGallery(
  supabase: SupabaseClient,
  productId: string,
  gallery: string[],
  title: string
) {
  const { error: clearError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);

  if (clearError) return clearError.message;

  if (!gallery.length) return null;

  const { error } = await supabase.from("product_images").insert(
    gallery.map((url, position) => ({
      product_id: productId,
      url,
      alt: title,
      position,
    }))
  );

  return error?.message ?? null;
}

export async function createProduct(
  _state: CatalogActionState,
  formData: FormData
): Promise<CatalogActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const parsed = parseProductForm(formData);

  if ("error" in parsed) return { error: parsed.error };

  const input = parsed.data;
  const { data: category, error: categoryError } = await session.supabase
    .from("categories")
    .select("id")
    .eq("id", input.category_id)
    .maybeSingle();

  if (categoryError) return { error: categoryError.message };
  if (!category) return { error: "That category no longer exists." };

  const { data: existing, error: slugError } = await session.supabase
    .from("products")
    .select("id")
    .eq("slug", input.slug)
    .maybeSingle();

  if (slugError) return { error: slugError.message };
  if (existing) return { error: "That slug is already used by another product." };

  const { gallery, ...product } = input;
  const { data: created, error } = await session.supabase
    .from("products")
    .insert(product)
    .select("id")
    .single();

  if (error) return { error: error.message };

  const galleryError = await syncGallery(
    session.supabase,
    created.id,
    gallery,
    product.title
  );

  if (galleryError) {
    return { error: `Product saved, but the gallery failed: ${galleryError}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProduct(
  _state: CatalogActionState,
  formData: FormData
): Promise<CatalogActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const id = text(formData, "product_id", 80);
  if (!id) return { error: "Missing product id." };

  const parsed = parseProductForm(formData);

  if ("error" in parsed) return { error: parsed.error };

  const input = parsed.data;
  const { data: category, error: categoryError } = await session.supabase
    .from("categories")
    .select("id")
    .eq("id", input.category_id)
    .maybeSingle();

  if (categoryError) return { error: categoryError.message };
  if (!category) return { error: "That category no longer exists." };

  const { data: existing, error: slugError } = await session.supabase
    .from("products")
    .select("id")
    .eq("slug", input.slug)
    .neq("id", id)
    .maybeSingle();

  if (slugError) return { error: slugError.message };
  if (existing) return { error: "That slug is already used by another product." };

  const { gallery, ...product } = input;
  const { error } = await session.supabase
    .from("products")
    .update(product)
    .eq("id", id);

  if (error) return { error: error.message };

  const galleryError = await syncGallery(
    session.supabase,
    id,
    gallery,
    product.title
  );

  if (galleryError) {
    return { error: `Product saved, but the gallery failed: ${galleryError}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${id}`);
  return { ok: true };
}

export async function deleteProduct(
  _state: CatalogActionState,
  formData: FormData
): Promise<CatalogActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const id = text(formData, "product_id", 80);
  if (!id) return { error: "Missing product id." };

  const { error } = await session.supabase.from("products").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}
