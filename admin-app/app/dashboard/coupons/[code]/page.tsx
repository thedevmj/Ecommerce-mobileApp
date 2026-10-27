import { AlertCircle, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ConfirmDeleteForm from "@/components/catalog/ConfirmDeleteForm";
import CouponForm from "@/components/coupons/CouponForm";
import { deleteCoupon } from "@/app/dashboard/coupons/actions";
import { couponDiscountLabel, couponState, type Coupon } from "@/lib/coupons";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit coupon | Shopcart Admin",
};

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-5">
        <Link
          href="/dashboard/coupons"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to coupons
        </Link>
        <div className="rounded-3xl border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-semibold text-danger">
                Could not load this coupon
              </p>
              <p className="mt-1 text-sm leading-6 text-danger/80">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) notFound();

  const coupon = data as Coupon;
  const state = couponState(coupon);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/coupons"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        Back to coupons
      </Link>

      <PageHeader
        eyebrow="Promotions"
        title={coupon.code}
        description={`${couponDiscountLabel(coupon)} · ${state === "active" ? "Redeemable" : state === "expired" ? "Expired" : "Inactive"}. Update the code, discount, limit, or expiry.`}
      />

      <CouponForm coupon={coupon} />

      <section className="max-w-3xl rounded-3xl border border-danger/20 bg-danger-soft p-5 shadow-sm sm:p-6">
        <h2 className="font-semibold text-danger">Delete coupon</h2>
        <p className="mt-1 text-sm leading-6 text-danger/80">
          Existing orders keep their discount, but this code is removed from
          them. This cannot be undone.
        </p>
        <div className="mt-4">
          <ConfirmDeleteForm
            action={deleteCoupon}
            idName="coupon_code"
            id={coupon.code}
            message={`Delete coupon ${coupon.code}? Existing orders keep their discount.`}
            label="Delete coupon"
            successMessage="Coupon deleted."
          />
        </div>
      </section>
    </div>
  );
}
