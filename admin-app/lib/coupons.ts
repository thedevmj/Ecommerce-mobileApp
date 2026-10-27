import { formatMoney } from "@/lib/catalog";

export const COUPONS_PAGE_SIZE = 12;

export type Coupon = {
  code: string;
  description: string | null;
  percent_off: number | null;
  amount_off: number | string | null;
  min_subtotal: number | string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type CouponState = "active" | "inactive" | "expired";

export const COUPON_STATES = [
  { value: null, label: "All" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "inactive", label: "Inactive" },
] as const;

export function couponState(
  coupon: Pick<Coupon, "is_active" | "expires_at">,
  now = new Date()
): CouponState {
  if (coupon.expires_at) {
    const expires = new Date(coupon.expires_at);
    if (!Number.isNaN(expires.getTime()) && expires.getTime() <= now.getTime()) {
      return "expired";
    }
  }

  return coupon.is_active ? "active" : "inactive";
}

export function couponStateLabel(state: CouponState) {
  if (state === "active") return "Active";
  if (state === "expired") return "Expired";
  return "Inactive";
}

export function couponStateTone(state: CouponState) {
  if (state === "active") {
    return "bg-success-soft text-success ring-1 ring-success/15";
  }
  if (state === "expired") {
    return "bg-danger-soft text-danger ring-1 ring-danger/15";
  }
  return "bg-canvas text-muted ring-1 ring-line";
}

export function couponType(coupon: Pick<Coupon, "percent_off">) {
  return coupon.percent_off !== null ? "percent" : "amount";
}

export function couponDiscountLabel(
  coupon: Pick<Coupon, "percent_off" | "amount_off">
) {
  if (coupon.percent_off !== null) {
    return `${coupon.percent_off}% off`;
  }

  if (coupon.amount_off !== null) {
    return `${formatMoney(coupon.amount_off)} off`;
  }

  return "No discount";
}

export function couponDateValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

export function couponExpiryLabel(value: string | null) {
  if (!value) return "No expiry";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiry";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
