"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin";

export type ReviewActionState = {
  ok?: boolean;
  error?: string;
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim().slice(0, 80);
}

export async function deleteReview(
  _state: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const id = text(formData, "review_id");
  if (!id) return { error: "Missing review id." };

  const { data: review, error: reviewError } = await session.supabase
    .from("reviews")
    .select("product_id")
    .eq("id", id)
    .maybeSingle();

  if (reviewError) return { error: reviewError.message };
  if (!review) return { error: "That review no longer exists." };

  const { error } = await session.supabase.from("reviews").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reviews");
  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${review.product_id}`);
  return { ok: true };
}
