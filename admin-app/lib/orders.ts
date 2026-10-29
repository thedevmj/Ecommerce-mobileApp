export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  id: string;
  product_id: string | null;
  title_snapshot: string;
  image_snapshot: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  previous_status?: OrderStatus | null;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  coupon_code: string | null;
  shipping_address: unknown;
  notes: string | null;
  placed_at: string;
  created_at: string;
  updated_at: string;
  payment_method?: string | null;
  order_items?: OrderItem[];
};

export type ShippingAddress = {
  label: string;
  recipient: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

type StatusMeta = {
  label: string;
  description: string;
  badge: string;
  dot: string;
};

export const PRIMARY_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    description: "Awaiting confirmation",
    badge: "bg-warning-soft text-warning ring-1 ring-warning/15",
    dot: "bg-warning",
  },
  paid: {
    label: "Paid",
    description: "Payment recorded",
    badge: "bg-success-soft text-success ring-1 ring-success/15",
    dot: "bg-success",
  },
  processing: {
    label: "Processing",
    description: "Being prepared",
    badge: "bg-brand-soft text-brand-strong ring-1 ring-brand/15",
    dot: "bg-brand",
  },
  shipped: {
    label: "Shipped",
    description: "On the way",
    badge: "bg-brand-soft text-brand-strong ring-1 ring-brand/15",
    dot: "bg-brand",
  },
  delivered: {
    label: "Delivered",
    description: "Completed",
    badge: "bg-success-soft text-success ring-1 ring-success/15",
    dot: "bg-success",
  },
  cancelled: {
    label: "Cancelled",
    description: "Closed",
    badge: "bg-danger-soft text-danger ring-1 ring-danger/15",
    dot: "bg-danger",
  },
  refunded: {
    label: "Refunded",
    description: "Returned",
    badge: "bg-canvas text-muted ring-1 ring-line",
    dot: "bg-muted",
  },
};

const NEXT_STATUSES: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}

export function nextStatuses(status: OrderStatus): readonly OrderStatus[] {
  return NEXT_STATUSES[status];
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(value: number | string | null | undefined) {
  return currencyFormatter.format(Number(value ?? 0));
}

export function formatOrderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatOrderDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function parseShippingAddress(value: unknown): ShippingAddress {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const text = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
    return "";
  };

  return {
    label: text("label"),
    recipient: text("recipient", "name"),
    line1: text("line1", "address"),
    line2: text("line2"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code", "postalCode", "zip"),
    country: text("country"),
    phone: text("phone"),
  };
}

export function itemCount(order: Pick<Order, "order_items">) {
  return (order.order_items ?? []).reduce(
    (total, item) => total + item.quantity,
    0
  );
}
