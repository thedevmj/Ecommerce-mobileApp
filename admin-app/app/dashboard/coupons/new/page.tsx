import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CouponForm from "@/components/coupons/CouponForm";

export const metadata: Metadata = {
  title: "New coupon | Shopcart Admin",
};

export default function NewCouponPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Promotions"
        title="New coupon"
        description="Create a promo code with a percentage or fixed-amount discount."
      />
      <CouponForm />
    </div>
  );
}
