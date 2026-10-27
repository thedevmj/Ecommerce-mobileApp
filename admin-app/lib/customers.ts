import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderStatus } from "@/lib/orders";

export const CUSTOMERS_PAGE_SIZE = 20;

export type CustomerSummary = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
  order_count: number;
  total_spent: number | string;
  last_order_at: string | null;
};

export type CustomerDirectory = {
  customers: CustomerSummary[];
  total: number;
  emailAvailable: boolean;
  error: string | null;
};

export type CustomerOrder = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number | string;
  placed_at: string;
  order_items?: { quantity: number }[];
};

type CustomerRow = CustomerSummary & {
  total_count?: number | string;
};

type DirectoryOptions = {
  search?: string;
  page?: number;
};

function safeSearch(value: string) {
  return value.replace(/[%_(),]/g, " ").trim().slice(0, 80);
}

function aggregateOrders(
  profiles: Omit<CustomerSummary, "order_count" | "total_spent" | "last_order_at">[],
  orders: {
    user_id: string;
    total: number | string;
    status: OrderStatus;
    placed_at: string;
  }[]
) {
  const summaries = new Map(
    profiles.map((profile) => [
      profile.id,
      {
        ...profile,
        order_count: 0,
        total_spent: 0,
        last_order_at: null as string | null,
      },
    ])
  );

  for (const order of orders) {
    const summary = summaries.get(order.user_id);
    if (!summary) continue;

    summary.order_count += 1;

    if (order.status !== "cancelled" && order.status !== "refunded") {
      summary.total_spent += Number(order.total ?? 0);
    }

    if (!summary.last_order_at || order.placed_at > summary.last_order_at) {
      summary.last_order_at = order.placed_at;
    }
  }

  return Array.from(summaries.values());
}

async function loadDirectoryFallback(
  supabase: SupabaseClient,
  { search = "", page = 1 }: DirectoryOptions
): Promise<CustomerDirectory> {
  const offset = (page - 1) * CUSTOMERS_PAGE_SIZE;
  const term = safeSearch(search);

  let profilesQuery = supabase
    .from("profiles")
    .select(
      "id, full_name, phone, avatar_url, role, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + CUSTOMERS_PAGE_SIZE - 1);

  if (term) {
    profilesQuery = profilesQuery.or(
      `full_name.ilike.%${term}%,phone.ilike.%${term}%`
    );
  }

  const { data: profiles, count, error } = await profilesQuery;

  if (error) {
    return {
      customers: [],
      total: 0,
      emailAvailable: false,
      error: error.message,
    };
  }

  const rows = (profiles ?? []).map((profile) => ({
    ...profile,
    email: null as string | null,
  }));

  const ids = rows.map((profile) => profile.id);
  const orders = ids.length
    ? (
        await supabase
          .from("orders")
          .select("user_id, total, status, placed_at")
          .in("user_id", ids)
      ).data ?? []
    : [];

  return {
    customers: aggregateOrders(rows, orders),
    total: count ?? rows.length,
    emailAvailable: false,
    error: null,
  };
}

export async function fetchCustomerDirectory(
  supabase: SupabaseClient,
  { search = "", page = 1 }: DirectoryOptions = {}
): Promise<CustomerDirectory> {
  const offset = (page - 1) * CUSTOMERS_PAGE_SIZE;
  const { data, error } = await supabase.rpc("admin_customer_directory", {
    p_customer_id: null,
    p_search: safeSearch(search) || null,
    p_limit: CUSTOMERS_PAGE_SIZE,
    p_offset: offset,
  });

  if (error) {
    return loadDirectoryFallback(supabase, { search, page });
  }

  const rows = (data ?? []) as CustomerRow[];
  const total = rows.length ? Number(rows[0].total_count ?? rows.length) : 0;

  return {
    customers: rows,
    total,
    emailAvailable: true,
    error: null,
  };
}

export async function fetchCustomerDetail(
  supabase: SupabaseClient,
  id: string
): Promise<{
  customer: CustomerSummary | null;
  emailAvailable: boolean;
  error: string | null;
}> {
  const { data, error } = await supabase.rpc("admin_customer_directory", {
    p_customer_id: id,
    p_search: null,
    p_limit: 1,
    p_offset: 0,
  });

  if (!error) {
    const rows = (data ?? []) as CustomerRow[];
    return {
      customer: rows[0] ?? null,
      emailAvailable: true,
      error: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url, role, created_at")
    .eq("id", id)
    .maybeSingle();

  if (profileError) {
    return { customer: null, emailAvailable: false, error: profileError.message };
  }

  if (!profile) {
    return { customer: null, emailAvailable: false, error: null };
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("user_id, total, status, placed_at")
    .eq("user_id", id);

  const [customer] = aggregateOrders(
    [{ ...profile, email: null }],
    orders ?? []
  );

  return { customer, emailAvailable: false, error: null };
}

export async function fetchCustomerOrders(
  supabase: SupabaseClient,
  id: string
): Promise<{ orders: CustomerOrder[]; error: string | null }> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total, placed_at, order_items(quantity)")
    .eq("user_id", id)
    .order("placed_at", { ascending: false });

  return {
    orders: (data ?? []) as unknown as CustomerOrder[],
    error: error?.message ?? null,
  };
}

export function customerName(
  customer: Pick<CustomerSummary, "full_name" | "email">
) {
  return customer.full_name?.trim() || customer.email?.split("@")[0] || "Customer";
}

export function customerInitial(
  customer: Pick<CustomerSummary, "full_name" | "email">
) {
  return customerName(customer).charAt(0).toUpperCase() || "C";
}
