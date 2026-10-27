"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin";

export type CouponActionState = {
  ok?: boolean;
  error?: string;
};

type CouponInput = {
  code: string;
  description: string | null;
  percent_off: number | null;
  amount_off: number | null;
  min_subtotal: number;
  is_active: boolean;
  expires_at: string | null;
};

function text(formData: FormData, key: string, max = 500) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function parseCouponForm(
  formData: FormData
): { error: string } | { data: CouponInput } {
  const code = text(formData, "code", 40).toUpperCase();
  const description = text(formData, "description", 300) || null;
  const discountType = text(formData, "discount_type", 20);
  const rawValue = Number(text(formData, "value", 40));
  const minSubtotal = Number(text(formData, "min_subtotal", 40) || "0");
  const expiryDate = text(formData, "expires_at", 20);
  let expiresAt: string | null = null;

  if (!code) return { error: "Add a coupon code." };
  if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(code)) {
    return {
      error:
        "Codes must be 3–40 characters using letters, numbers, hyphens, or underscores.",
    };
  }
  if (discountType !== "percent" && discountType !== "amount") {
    return { error: "Choose a discount type." };
  }
  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return { error: "Enter a discount value greater than zero." };
  }
  if (!Number.isFinite(minSubtotal) || minSubtotal < 0) {
    return { error: "Minimum subtotal must be zero or more." };
  }
  if (expiryDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      return { error: "Enter a valid expiry date." };
    }

    const parsedExpiry = new Date(`${expiryDate}T23:59:59.999Z`);
    if (Number.isNaN(parsedExpiry.getTime())) {
      return { error: "Enter a valid expiry date." };
    }
    expiresAt = parsedExpiry.toISOString();
  }

  const percentOff =
    discountType === "percent" ? rawValue : null;
  const amountOff =
    discountType === "amount" ? Math.round(rawValue * 100) / 100 : null;

  if (
    percentOff !== null &&
    (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100)
  ) {
    return { error: "Percentage discounts must be a whole number from 1 to 100." };
  }

  return {
    data: {
      code,
      description,
      percent_off: percentOff,
      amount_off: amountOff,
      min_subtotal: Math.round(minSubtotal * 100) / 100,
      is_active: formData.get("is_active") === "on",
      expires_at: expiresAt,
    },
  };
}

function revalidateCoupons() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/coupons");
}

export async function createCoupon(
  _state: CouponActionState,
  formData: FormData
): Promise<CouponActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const parsed = parseCouponForm(formData);

  if ("error" in parsed) return { error: parsed.error };

  const { data: existing, error: lookupError } = await session.supabase
    .from("coupons")
    .select("code")
    .eq("code", parsed.data.code)
    .maybeSingle();

  if (lookupError) return { error: lookupError.message };
  if (existing) return { error: "That coupon code already exists." };

  const { error } = await session.supabase
    .from("coupons")
    .insert(parsed.data);

  if (error) return { error: error.message };

  revalidateCoupons();
  redirect("/dashboard/coupons");
}

export async function updateCoupon(
  _state: CouponActionState,
  formData: FormData
): Promise<CouponActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const originalCode = text(formData, "original_code", 40).toUpperCase();

  if (!originalCode) return { error: "Missing coupon code." };

  const parsed = parseCouponForm(formData);

  if ("error" in parsed) return { error: parsed.error };

  if (parsed.data.code !== originalCode) {
    const { data: existing, error: lookupError } = await session.supabase
      .from("coupons")
      .select("code")
      .eq("code", parsed.data.code)
      .maybeSingle();

    if (lookupError) return { error: lookupError.message };
    if (existing) return { error: "That coupon code already exists." };

    const { count, error: orderError } = await session.supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("coupon_code", originalCode);

    if (orderError) return { error: orderError.message };
    if ((count ?? 0) > 0) {
      return {
        error:
          "This code has already been used on orders and cannot be renamed. Create a new coupon instead.",
      };
    }
  }

  const { data: updated, error } = await session.supabase
    .from("coupons")
    .update(parsed.data)
    .eq("code", originalCode)
    .select("code")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!updated) return { error: "This coupon no longer exists." };

  revalidateCoupons();
  revalidatePath(`/dashboard/coupons/${parsed.data.code}`);

  if (parsed.data.code !== originalCode) {
    revalidatePath(`/dashboard/coupons/${originalCode}`);
    redirect(`/dashboard/coupons/${encodeURIComponent(parsed.data.code)}`);
  }

  return { ok: true };
}

export async function deleteCoupon(
  _state: CouponActionState,
  formData: FormData
): Promise<CouponActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const code = text(formData, "coupon_code", 40).toUpperCase();

  if (!code) return { error: "Missing coupon code." };

  const { error } = await session.supabase
    .from("coupons")
    .delete()
    .eq("code", code);

  if (error) return { error: error.message };

  revalidateCoupons();
  revalidatePath(`/dashboard/coupons/${code}`);
  redirect("/dashboard/coupons");
}
