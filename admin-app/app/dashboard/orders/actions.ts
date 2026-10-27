"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  isOrderStatus,
  nextStatuses,
  ORDER_STATUS_META,
  type OrderStatus,
} from "@/lib/orders";

export type StatusActionState = {
  ok?: boolean;
  error?: string;
};

function revalidateOrder(orderId: string) {
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard");
}

export async function updateOrderStatus(
  _previous: StatusActionState,
  formData: FormData
): Promise<StatusActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session has expired. Sign in again." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: "Admin access is required to update orders." };
  }

  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!orderId) {
    return { error: "The order could not be identified." };
  }

  if (!isOrderStatus(status)) {
    return { error: "Choose a valid order status." };
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!order || !isOrderStatus(order.status)) {
    return { error: "This order is no longer available." };
  }

  const current = order.status as OrderStatus;

  if (!nextStatuses(current).includes(status)) {
    return {
      error: `A ${ORDER_STATUS_META[current].label.toLowerCase()} order cannot move to ${ORDER_STATUS_META[status].label.toLowerCase()}.`,
    };
  }

  const supportsUndo = "previous_status" in order;

  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update(
      supportsUndo ? { status, previous_status: current } : { status }
    )
    .eq("id", orderId)
    .eq("status", current)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updated) {
    return {
      error: "This order changed while you were updating it. Refresh and try again.",
    };
  }

  revalidateOrder(orderId);

  return { ok: true };
}

export async function undoOrderStatus(
  _previous: StatusActionState,
  formData: FormData
): Promise<StatusActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session has expired. Sign in again." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: "Admin access is required to update orders." };
  }

  const orderId = String(formData.get("order_id") ?? "");

  if (!orderId) {
    return { error: "The order could not be identified." };
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!order || !isOrderStatus(order.status)) {
    return { error: "This order is no longer available." };
  }

  if (!("previous_status" in order)) {
    return {
      error:
        "Status undo is unavailable. Apply migration 0007_order_status_undo.sql.",
    };
  }

  const current = order.status as OrderStatus;
  const previous = order.previous_status;

  if (!isOrderStatus(previous) || previous === current) {
    return { error: "There is no recent status change to undo." };
  }

  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update({ status: previous, previous_status: null })
    .eq("id", orderId)
    .eq("status", current)
    .eq("previous_status", previous)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updated) {
    return {
      error: "This order changed while you were undoing it. Refresh and try again.",
    };
  }

  revalidateOrder(orderId);

  return { ok: true };
}