"use client";

import { AlertCircle, ChevronDown, Loader2 } from "lucide-react";
import { useActionState } from "react";
import {
  updateOrderStatus,
  type StatusActionState,
} from "@/app/dashboard/orders/actions";
import {
  nextStatuses,
  ORDER_STATUS_META,
  type OrderStatus,
} from "@/lib/orders";
import UndoOrderStatusButton from "@/components/UndoOrderStatusButton";

const initialState: StatusActionState = {};

export default function OrderStatusQuickForm({
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
  const transitions = nextStatuses(status);
  const locked = transitions.length === 0;
  const options = [status, ...transitions];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="order_id" value={orderId} />
        <label className="sr-only" htmlFor={`order-status-${orderId}`}>
          Change status for this order
        </label>
        <span className="relative">
          <select
            key={status}
            id={`order-status-${orderId}`}
            name="status"
            defaultValue={status}
            disabled={pending || locked}
            title={
              locked
                ? `${ORDER_STATUS_META[status].label} orders cannot be changed.`
                : "Choose the next order status"
            }
            onChange={(event) => {
              if (event.target.value !== status) {
                event.currentTarget.form?.requestSubmit();
              }
            }}
            className="h-9 appearance-none rounded-xl border border-line bg-panel pl-3 pr-8 text-xs font-semibold shadow-sm outline-none transition hover:bg-canvas focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option === status
                  ? `${ORDER_STATUS_META[option].label} (current)`
                  : ORDER_STATUS_META[option].label}
              </option>
            ))}
          </select>
          {pending ? (
            <Loader2
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-brand"
            />
          ) : (
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
            />
          )}
        </span>
        {state.error ? (
          <span
            role="alert"
            title={state.error}
            className="inline-flex items-center gap-1 text-xs text-danger"
          >
            <AlertCircle size={13} />
            <span className="max-w-24 truncate">Update failed</span>
          </span>
        ) : null}
      </form>
      {previousStatus ? (
        <UndoOrderStatusButton
          orderId={orderId}
          previousStatus={previousStatus}
          compact
        />
      ) : null}
    </div>
  );
}
