"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin";
import { isValidImageUrl, slugify } from "@/lib/catalog";

export type CategoryActionState = {
  ok?: boolean;
  error?: string;
};

type CategoryInput = {
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

function text(formData: FormData, key: string, max = 500) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function parseCategoryForm(
  formData: FormData
): { error: string } | { data: CategoryInput } {
  const name = text(formData, "name", 120);
  const slug = slugify(text(formData, "slug", 160) || name);
  const icon = text(formData, "icon", 40) || null;
  const imageUrl = text(formData, "image_url", 2048) || null;
  const sortOrder = Number(text(formData, "sort_order", 20) || "0");

  if (!name) return { error: "Add a category name." };
  if (!slug) return { error: "Add a URL slug." };
  if (imageUrl && !isValidImageUrl(imageUrl)) {
    return { error: "Enter a valid image URL." };
  }
  if (!Number.isInteger(sortOrder)) {
    return { error: "Sort order must be a whole number." };
  }

  return {
    data: {
      name,
      slug,
      icon,
      image_url: imageUrl,
      sort_order: sortOrder,
      is_active: formData.get("is_active") === "on",
    },
  };
}

export async function createCategory(
  _state: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const parsed = parseCategoryForm(formData);

  if ("error" in parsed) return { error: parsed.error };

  const { data: existing, error: slugError } = await session.supabase
    .from("categories")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();

  if (slugError) return { error: slugError.message };
  if (existing) return { error: "That slug is already used by another category." };

  const { error } = await session.supabase
    .from("categories")
    .insert(parsed.data);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/categories");
}

export async function updateCategory(
  _state: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const id = text(formData, "category_id", 80);
  if (!id) return { error: "Missing category id." };

  const parsed = parseCategoryForm(formData);

  if ("error" in parsed) return { error: parsed.error };

  const { data: existing, error: slugError } = await session.supabase
    .from("categories")
    .select("id")
    .eq("slug", parsed.data.slug)
    .neq("id", id)
    .maybeSingle();

  if (slugError) return { error: slugError.message };
  if (existing) return { error: "That slug is already used by another category." };

  const { error } = await session.supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/categories/${id}`);
  return { ok: true };
}

export async function deleteCategory(
  _state: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const id = text(formData, "category_id", 80);
  if (!id) return { error: "Missing category id." };

  const { count, error: countError } = await session.supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) return { error: countError.message };

  if ((count ?? 0) > 0) {
    return {
      error:
        "This category still contains products. Move those products to another category first.",
    };
  }

  const { error } = await session.supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/categories");
}
