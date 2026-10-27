"use client";

import { AlertCircle, ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createCoupon,
  updateCoupon,
  type CouponActionState,
} from "@/app/dashboard/coupons/actions";
import {
  couponDateValue,
  couponType,
  type Coupon,
} from "@/lib/coupons";

type CouponFormProps = {
  coupon?: Coupon;
};

const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export default function CouponForm({ coupon }: CouponFormProps) {
  const action = coupon ? updateCoupon : createCoupon;
  const [state, formAction, pending] = useActionState<
    CouponActionState,
    FormData
  >(action, {});
  const [discountType, setDiscountType] = useState(
    coupon ? couponType(coupon) : "percent"
  );
  const currentValue = coupon
    ? coupon.percent_off ?? coupon.amount_off ?? ""
    : "";

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {coupon ? (
        <input type="hidden" name="original_code" value={coupon.code} />
      ) : null}

      {state.error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="leading-6">{state.error}</p>
        </div>
      ) : null}

      {state.ok ? (
        <div className="rounded-2xl border border-success/20 bg-success-soft px-4 py-3 text-sm font-medium text-success">
          Coupon saved.
        </div>
      ) : null}

      <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold tracking-tight">Coupon details</h2>
        <p className="mt-1 text-sm text-muted">
          Codes are matched at checkout. Percentage and fixed-amount discounts
          are both supported.
        </p>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Code</span>
              <input
                name="code"
                required
                maxLength={40}
                defaultValue={coupon?.code}
                placeholder="SHOP10"
                autoCapitalize="characters"
                spellCheck={false}
                className={`${fieldClass} font-mono uppercase`}
              />
              <p className="mt-1.5 text-xs text-muted">
                Letters, numbers, hyphens, and underscores. Codes used on
                orders cannot be renamed.
              </p>
            </label>

            <label className="block">
              <span className={labelClass}>Expiry date</span>
              <input
                name="expires_at"
                type="date"
                defaultValue={couponDateValue(coupon?.expires_at ?? null)}
                className={fieldClass}
              />
              <p className="mt-1.5 text-xs text-muted">
                Optional. The code stops working after this date.
              </p>
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              name="description"
              rows={3}
              maxLength={300}
              defaultValue={coupon?.description ?? ""}
              placeholder="10% off the entire order"
              className="w-full rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelClass}>Discount type</span>
              <select
                name="discount_type"
                value={discountType}
                onChange={(event) => setDiscountType(event.target.value)}
                className={fieldClass}
              >
                <option value="percent">Percentage</option>
                <option value="amount">Fixed amount</option>
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>
                {discountType === "percent"
                  ? "Percentage off"
                  : "Amount off (USD)"}
              </span>
              <input
                name="value"
                type="number"
                required
                min={discountType === "percent" ? 1 : 0.01}
                max={discountType === "percent" ? 100 : undefined}
                step={discountType === "percent" ? 1 : 0.01}
                defaultValue={currentValue}
                placeholder={discountType === "percent" ? "10" : "5.00"}
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Minimum subtotal</span>
              <input
                name="min_subtotal"
                type="number"
                min={0}
                step="0.01"
                defaultValue={Number(coupon?.min_subtotal ?? 0)}
                placeholder="0.00"
                className={fieldClass}
              />
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-line bg-canvas p-3.5">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={coupon?.is_active ?? true}
              className="mt-0.5 h-4 w-4 rounded accent-brand"
            />
            <span>
              <span className="block text-sm font-medium text-ink">Active</span>
              <span className="block text-xs leading-5 text-muted">
                Inactive codes stay in the database but cannot be redeemed.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {pending ? "Saving" : coupon ? "Save changes" : "Create coupon"}
        </button>
        <Link
          href="/dashboard/coupons"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-panel px-4 text-sm font-semibold transition hover:bg-canvas"
        >
          <ArrowLeft size={16} />
          Back to coupons
        </Link>
      </div>
    </form>
  );
}
