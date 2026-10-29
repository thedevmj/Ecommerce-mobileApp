import { Product } from "@/type";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface SupabaseProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  brand?: string | null;
  stock: number;
  rating: number;
  review_count: number;
  image_url?: string | null;
  is_active: boolean;
  slug: string;
  categories?: { slug: string; name: string } | { slug: string; name: string }[] | null;
  product_images?: { url: string; position: number }[] | null;
}

const mapSupabaseProduct = (product: SupabaseProduct): Product => {
  const cat = Array.isArray(product.categories) ? product.categories[0] : product.categories;
  const images = (product.product_images || [])
    .sort((a, b) => a.position - b.position)
    .map((img) => img.url)
    .filter(Boolean);

  const image = product.image_url || images[0] || "";

  return {
    id: product.id,
    title: product.title,
    price: Number(product.price),
    description: product.description || "",
    category: cat?.slug || "",
    image,
    images: images.length > 0 ? images : undefined,
    brand: product.brand || undefined,
    stock: product.stock,
    compareAtPrice: product.compare_at_price ? Number(product.compare_at_price) : undefined,
    rating: {
      rate: Number(product.rating || 0),
      count: Number(product.review_count || 0),
    },
    slug: product.slug,
  };
};

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(config: RateLimitConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) {
      const waitMs = this.windowMs - (now - this.timestamps[0]) + 10;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return this.throttle(fn);
    }
    this.timestamps.push(Date.now());
    return fn();
  }
}

const productsLimiter = new RateLimiter({ maxRequests: 10, windowMs: 1000 });
const categoriesLimiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });

export interface ProductsQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

const DEFAULT_PAGE_SIZE = 50;

const getProducts = async (query: ProductsQuery = {}): Promise<Product[]> => {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.max(1, Math.min(query.limit ?? DEFAULT_PAGE_SIZE, 100));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return productsLimiter.throttle(async () => {
    try {
      if (isSupabaseConfigured) {
        let q = supabase
          .from("products")
          .select(
            `
            id,
            title,
            description,
            price,
            compare_at_price,
            brand,
            stock,
            rating,
            review_count,
            image_url,
            slug,
            is_active,
            categories!inner (slug, name),
            product_images (url, position)
          `
          )
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (query.category) {
          q = q.eq("categories.slug", query.category);
        }
        if (query.search && query.search.trim()) {
          q = q.ilike("title", `%${query.search.trim()}%`);
        }

        const { data, error } = await q.range(from, to);

        if (error) throw error;
        if (data) {
          return (data as SupabaseProduct[]).map(mapSupabaseProduct);
        }
      }

      const response = await fetch(
        `https://dummyjson.com/products?limit=${limit}&skip=${from}${query.search ? `&q=${encodeURIComponent(query.search)}` : ""}`
      );
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      const products = data.products || [];

      return products.map((product: any) => {
        const discount = product.discountPercentage ?? 0;
        const compareAtPrice =
          discount > 0
            ? Math.round((product.price / (1 - discount / 100)) * 100) / 100
            : undefined;
        return {
          id: product.id,
          title: product.title,
          price: product.price,
          description: product.description,
          category: product.category,
          image: product.thumbnail || product.images?.[0] || "",
          images: product.images,
          brand: product.brand,
          stock: product.stock,
          compareAtPrice,
          rating: {
            rate: product.rating,
            count: product.reviews?.length ?? 0,
          },
        };
      });
    } catch (error) {
      console.log("Failed to fetch products", error);
      throw error;
    }
  });
};

export const getProduct = async (id: string | number): Promise<Product> => {
  try {
    if (isSupabaseConfigured) {
      const query = supabase
        .from("products")
        .select(
          `
          id,
          title,
          description,
          price,
          compare_at_price,
          brand,
          stock,
          rating,
          review_count,
          image_url,
          slug,
          is_active,
          categories (slug, name),
          product_images (url, position)
        `
        )
        .eq("is_active", true);

      const { data: byId, error: idError } = await query.eq("id", String(id)).maybeSingle();
      if (byId && !idError) {
        return mapSupabaseProduct(byId as SupabaseProduct);
      }

      const { data: bySlug, error: slugError } = await query.eq("slug", String(id)).maybeSingle();
      if (bySlug && !slugError) {
        return mapSupabaseProduct(bySlug as SupabaseProduct);
      }

      if (idError && slugError) throw idError || slugError;
    }

    const response = await fetch(`https://dummyjson.com/products/${id}`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const product = await response.json();
    const discount = product.discountPercentage ?? 0;
    const compareAtPrice =
      discount > 0
        ? Math.round((product.price / (1 - discount / 100)) * 100) / 100
        : undefined;
    return {
      id: product.id,
      title: product.title,
      price: product.price,
      description: product.description,
      category: product.category,
      image: product.thumbnail || product.images?.[0] || "",
      images: product.images,
      brand: product.brand,
      stock: product.stock,
      compareAtPrice,
      rating: {
        rate: product.rating,
        count: product.reviews?.length ?? 0,
      },
    };
  } catch (error) {
    console.error(`Failed to fetch product with ID ${id}:`, error);
    throw error;
  }
};

const getCategories = async (): Promise<string[]> => {
  return categoriesLimiter.throttle(async () => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from("categories")
          .select("slug")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          return data.map((cat) => cat.slug);
        }
      }

      const response = await fetch("https://dummyjson.com/products/category-list");
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      return await response.json();
    } catch (error) {
      console.log("Failed to fetch categories", error);
      throw error;
    }
  });
};

export { getProducts, getCategories };
