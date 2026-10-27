"use client";

import { Loader2, Undo2 } from "lucide-react";
import { useActionState } from "react";
import {
  undoOrderStatus,
  type StatusActionState,
} from "@/app/dashboard/orders/actions";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/orders";

const initialState: StatusActionState = {};

export default function UndoOrderStatusButton({
  orderId,
  previousStatus,
  compact = false,
}: {
  orderId: string;
  previousStatus: OrderStatus;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    undoOrderStatus,
    initialState
  );
  const label = ORDER_STATUS_META[previousStatus].label;

  return (
    <form
      action={formAction}
      className={compact ? "flex flex-col items-start gap-1" : "space-y-2"}
    >
      <input type="hidden" name="order_id" value={orderId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Undo the last status change and return to ${label}`}
        title={`Undo the last status change and return to ${label}`}
        className={
          compact
            ? "inline-flex h-9 items-center gap-1.5 rounded-xl border border-warning/30 bg-warning-soft px-2.5 text-xs font-semibold text-warning transition hover:bg-warning/15 disabled:cursor-not-allowed disabled:opacity-60"
            : "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-warning/30 bg-warning-soft px-4 text-sm font-semibold text-warning transition hover:bg-warning/15 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {pending ? (
          <Loader2 size={compact ? 13 : 16} className="animate-spin" />
        ) : (
          <Undo2 size={compact ? 13 : 16} />
        )}
        {compact ? "Undo" : `Undo to ${label}`}
      </button>
      {state.error ? (
        <span
          role="alert"
          title={state.error}
          className={
            compact
              ? "max-w-28 truncate text-[11px] text-danger"
              : "text-sm leading-5 text-danger"
          }
        >
          {compact ? "Undo failed" : state.error}
        </span>
      ) : null}
    </form>
  );
}
