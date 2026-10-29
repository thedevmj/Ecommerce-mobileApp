import { getCategories, getProducts } from "@/lib/api";
import { Product } from "@/type";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ProductsState {
  products: Product[];
  categories: string[];
  loading: boolean;
  error: string | null;

  // Products actions
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
}

let productsRequest: Promise<void> | null = null;
let categoriesRequest: Promise<void> | null = null;
let pendingRequests = 0;

export const useProductsStore = create<ProductsState>()(
  persist(
    (set) => ({
      products: [],
      categories: [],
      loading: false,
      error: null,

      fetchProducts: () => {
        if (productsRequest) return productsRequest;

        productsRequest = (async () => {
          pendingRequests += 1;
          set({ loading: true, error: null });
          try {
            const products = await getProducts({ page: 1, limit: 100 });
            set({ products });
          } catch (error: any) {
            set({ error: error.message });
          } finally {
            pendingRequests = Math.max(0, pendingRequests - 1);
            set({ loading: pendingRequests > 0 });
            productsRequest = null;
          }
        })();

        return productsRequest;
      },
      fetchCategories: () => {
        if (categoriesRequest) return categoriesRequest;

        categoriesRequest = (async () => {
          pendingRequests += 1;
          set({ loading: true, error: null });
          try {
            const categories = await getCategories();
            set({ categories });
          } catch (error: any) {
            set({ error: error.message });
          } finally {
            pendingRequests = Math.max(0, pendingRequests - 1);
            set({ loading: pendingRequests > 0 });
            categoriesRequest = null;
          }
        })();

        return categoriesRequest;
      },
    }),
    {
      name: "products-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
      }),
    }
  )
);
