import { Product } from "@/type";

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

export const sortOptions: {
  key: SortKey;
  label: string;
  description: string;
}[] = [
  { key: "featured", label: "Featured", description: "Our default ordering" },
  {
    key: "price-asc",
    label: "Price: low to high",
    description: "Cheapest products first",
  },
  {
    key: "price-desc",
    label: "Price: high to low",
    description: "Most expensive products first",
  },
  {
    key: "rating",
    label: "Top rated",
    description: "Best customer ratings first",
  },
];

export interface ShopFilters {
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number;
}

export interface ShopQuery {
  query: string;
  category: string;
  filters: ShopFilters;
}

export interface ShopSelection extends ShopQuery {
  sort: SortKey;
}

export interface PriceBounds {
  min: number;
  max: number;
}

export interface PricePreset {
  key: string;
  label: string;
  min: number | null;
  max: number | null;
}

export interface ActiveFilter {
  key: string;
  label: string;
  clear: (filters: ShopFilters) => ShopFilters;
}

export const DEFAULT_FILTERS: ShopFilters = {
  brands: [],
  minPrice: null,
  maxPrice: null,
  minRating: 0,
};

export const DEFAULT_SORT: SortKey = "featured";

export const ratingOptions: { value: number; label: string }[] = [
  { value: 0, label: "Any rating" },
  { value: 4.5, label: "4.5 & up" },
  { value: 4, label: "4.0 & up" },
  { value: 3, label: "3.0 & up" },
];

const brandOf = (product: Product) => (product.brand ?? "").trim();

export function getBrands(products: Product[]): string[] {
  const brands = new Set<string>();

  products.forEach((product) => {
    const brand = brandOf(product);
    if (brand) brands.add(brand);
  });

  return Array.from(brands).sort((a, b) => a.localeCompare(b));
}

export function getPriceBounds(products: Product[]): PriceBounds {
  if (products.length === 0) return { min: 0, max: 0 };

  let min = Infinity;
  let max = 0;

  products.forEach((product) => {
    if (product.price < min) min = product.price;
    if (product.price > max) max = product.price;
  });

  return { min: Math.floor(min), max: Math.ceil(max) };
}

export function getPricePresets(bounds: PriceBounds): PricePreset[] {
  if (bounds.max <= 0) return [];

  const presets: PricePreset[] = [
    { key: "under-25", label: "Under $25", min: null, max: 25 },
    { key: "25-50", label: "$25 – $50", min: 25, max: 50 },
    { key: "50-100", label: "$50 – $100", min: 50, max: 100 },
    { key: "100-plus", label: "$100+", min: 100, max: null },
  ];

  return presets.filter(
    (preset) =>
      (preset.min ?? bounds.min) <= bounds.max &&
      (preset.max ?? bounds.max) >= bounds.min
  );
}

export const hasPriceFilter = (filters: ShopFilters) =>
  filters.minPrice != null || filters.maxPrice != null;

export function activeFilterCount(filters: ShopFilters): number {
  return (
    filters.brands.length +
    (hasPriceFilter(filters) ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0)
  );
}

export function priceRangeLabel(
  min: number | null,
  max: number | null
): string {
  if (min != null && max != null) {
    return `$${Math.round(min)} – $${Math.round(max)}`;
  }
  if (min != null) return `$${Math.round(min)}+`;
  if (max != null) return `Under $${Math.round(max)}`;
  return "";
}

export function getActiveFilters(filters: ShopFilters): ActiveFilter[] {
  const active: ActiveFilter[] = [];

  if (hasPriceFilter(filters)) {
    active.push({
      key: "price",
      label: priceRangeLabel(filters.minPrice, filters.maxPrice),
      clear: (current) => ({
        ...current,
        minPrice: null,
        maxPrice: null,
      }),
    });
  }

  filters.brands.forEach((brand) => {
    active.push({
      key: `brand-${brand}`,
      label: brand,
      clear: (current) => ({
        ...current,
        brands: current.brands.filter((item) => item !== brand),
      }),
    });
  });

  if (filters.minRating > 0) {
    active.push({
      key: "rating",
      label: `${filters.minRating}★ & up`,
      clear: (current) => ({ ...current, minRating: 0 }),
    });
  }

  return active;
}

function matchesQuery(product: Product, { query, category, filters }: ShopQuery) {
  const search = query.trim().toLowerCase();
  const brand = brandOf(product);

  const matchesCategory = category === "all" || product.category === category;

  const matchesSearch =
    search.length === 0 ||
    product.title.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search) ||
    brand.toLowerCase().includes(search);

  const matchesPrice =
    (filters.minPrice == null || product.price >= filters.minPrice) &&
    (filters.maxPrice == null || product.price <= filters.maxPrice);

  const matchesRating =
    filters.minRating <= 0 || product.rating.rate >= filters.minRating;

  const matchesBrand =
    filters.brands.length === 0 ||
    filters.brands.some((item) => item.toLowerCase() === brand.toLowerCase());

  return (
    matchesCategory && matchesSearch && matchesPrice && matchesRating && matchesBrand
  );
}

export function filterProducts(
  products: Product[],
  query: ShopQuery
): Product[] {
  return products.filter((product) => matchesQuery(product, query));
}

export function countResults(products: Product[], query: ShopQuery): number {
  return filterProducts(products, query).length;
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  switch (sort) {
    case "price-asc":
      return [...products].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...products].sort((a, b) => b.price - a.price);
    case "rating":
      return [...products].sort((a, b) => b.rating.rate - a.rating.rate);
    default:
      return products;
  }
}

export function selectProducts(
  products: Product[],
  selection: ShopSelection
): Product[] {
  return sortProducts(filterProducts(products, selection), selection.sort);
}
