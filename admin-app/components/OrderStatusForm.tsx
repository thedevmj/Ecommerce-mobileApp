"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import {
  updateOrderStatus,
  type StatusActionState,
} from "@/app/dashboard/orders/actions";
import {
  ORDER_STATUS_META,
  nextStatuses,
  type OrderStatus,
} from "@/lib/orders";
import UndoOrderStatusButton from "@/components/UndoOrderStatusButton";

const initialState: StatusActionState = {};

export default function OrderStatusForm({
  orderId,
  status,
  previousStatus,
}: {
  orderId: string;
  status: OrderStatus;
  previousStatus?: OrderStatus | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateOrderStatus,
    initialState
  );
  const options = nextStatuses(status);

  return (
    <div className="space-y-3">
      {options.length ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="order_id" value={orderId} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Next status
            </span>
            <select
              key={status}
              name="status"
              defaultValue={options[0]}
              disabled={pending}
              className="h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {ORDER_STATUS_META[option].label} —{" "}
                  {ORDER_STATUS_META[option].description}
                </option>
              ))}
            </select>
          </label>

          {state.error ? (
            <p
              role="alert"
              className="rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
            >
              {state.error}
            </p>
          ) : null}

          {state.ok ? (
            <p className="rounded-xl border border-success/20 bg-success-soft px-3 py-2.5 text-sm text-success">
              Order status updated.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Updating status" : "Update status"}
            {!pending ? <ArrowRight size={16} /> : null}
          </button>
        </form>
      ) : (
        <p className="rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm text-muted">
          This order is closed. No further status changes are available.
        </p>
      )}

      {previousStatus ? (
        <UndoOrderStatusButton
          orderId={orderId}
          previousStatus={previousStatus}
        />
      ) : null}
    </div>
  );
}
