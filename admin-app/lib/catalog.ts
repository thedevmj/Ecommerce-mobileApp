export const CATALOG_PAGE_SIZE = 12;
export const LOW_STOCK_THRESHOLD = 5;

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id?: string;
  url: string;
  alt: string | null;
  position: number;
};

export type CatalogProduct = {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  brand: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  stock: number;
  rating: number | string;
  review_count: number;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: { name: string; slug: string } | null;
  product_images?: ProductImage[];
};

export type ReviewWithProduct = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  updated_at: string;
  products?: { title: string; slug: string } | null;
};

export function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value ?? 0));
}

export function formatCatalogDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function isValidImageUrl(value: string) {
  if (!value) return true;

  if (value.startsWith("/")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseGallery(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, 8);
}

export function stockLevel(stock: number) {
  if (stock <= 0) {
    return {
      label: "Out of stock",
      tone: "bg-danger-soft text-danger ring-1 ring-danger/15",
    };
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      label: `Low stock · ${stock}`,
      tone: "bg-warning-soft text-warning ring-1 ring-warning/15",
    };
  }

  return {
    label: `${stock} in stock`,
    tone: "bg-success-soft text-success ring-1 ring-success/15",
  };
}

export function productStatusTone(isActive: boolean) {
  return isActive
    ? "bg-success-soft text-success ring-1 ring-success/15"
    : "bg-canvas text-muted ring-1 ring-line";
}
