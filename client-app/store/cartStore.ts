import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CartItem, Product } from "@/type";

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
}

export const cartCount = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.quantity, 0);

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.product.price * item.quantity, 0);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.product.id === product.id
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return { items: [...state.items, { product, quantity }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.product.id !== productId)
              : state.items.map((item) =>
                  item.product.id === productId ? { ...item, quantity } : item
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "shopcart-cart",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
