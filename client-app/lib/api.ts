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

// Get all Products from Supabase
const getProducts = async (): Promise<Product[]> => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
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
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) {
        return (data as SupabaseProduct[]).map(mapSupabaseProduct);
      }
    }

    // Fallback to DummyJSON if Supabase not configured
    const response = await fetch("https://dummyjson.com/products?limit=0");
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
};

// Get single product
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

      // Try by id (uuid) first, if fails try by slug
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

    // Fallback
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

// Get all categories
const getCategories = async (): Promise<string[]> => {
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
};

export { getProducts, getCategories };
