import { Product } from "@/type";

const API_URL = "https://dummyjson.com";

interface DummyJsonProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  rating: number;
  stock?: number;
  brand?: string;
  thumbnail?: string;
  images?: string[];
  reviews?: unknown[];
}

interface DummyJsonProductsResponse {
  products: DummyJsonProduct[];
  total: number;
  skip: number;
  limit: number;
}

const mapProduct = (product: DummyJsonProduct): Product => {
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
};

const request = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};

// Get all Products
const getProducts = async (): Promise<Product[]> => {
  try {
    const data = await request<DummyJsonProductsResponse>("/products?limit=0");
    return data.products.map(mapProduct);
  } catch (error) {
    console.log("Failed to fetch products", error);
    throw error;
  }
};

// Get single product
export const getProduct = async (id: number): Promise<Product> => {
  try {
    const data = await request<DummyJsonProduct>(`/products/${id}`);
    return mapProduct(data);
  } catch (error) {
    console.error(`Failed to fetch product with ID ${id}:`, error);
    throw error;
  }
};

// Get all categories
const getCategories = async (): Promise<string[]> => {
  try {
    return await request<string[]>("/products/category-list");
  } catch (error) {
    console.log("Failed to fetch categories", error);
    throw error;
  }
};

export { getProducts, getCategories };
