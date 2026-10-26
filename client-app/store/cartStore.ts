import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CartItem, Product } from "@/type";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuthStore } from "./authStore";

interface CartState {
  items: CartItem[];
  isSyncing: boolean;
  cartId: string | null;

  addItem: (product: Product, quantity?: number) => Promise<void> | void;
  removeItem: (productId: string | number) => Promise<void> | void;
  setQuantity: (productId: string | number, quantity: number) => Promise<void> | void;
  clear: () => Promise<void> | void;

  loadFromSupabase: (userId: string) => Promise<void>;
  syncFromLocalToSupabase: (userId: string) => Promise<void>;
  reset: () => void;
}

export const cartCount = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.quantity, 0);

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.product.price * item.quantity, 0);

const mapCartItem = (item: any): CartItem | null => {
  const product = item.products;
  if (!product) return null;

  const images = (product.product_images || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((img: any) => img.url)
    .filter(Boolean);

  const image = product.image_url || images[0] || "";

  return {
    quantity: item.quantity,
    product: {
      id: product.id,
      title: product.title,
      price: Number(product.price),
      description: product.description || "",
      category: product.categories?.slug || product.categories?.[0]?.slug || "",
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
    },
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isSyncing: false,
      cartId: null,

      addItem: async (product, quantity = 1) => {
        const user = useAuthStore.getState().user;

        // Update local state first for instant UI
        set((state) => {
          const existing = state.items.find(
            (item) => String(item.product.id) === String(product.id)
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                String(item.product.id) === String(product.id)
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return { items: [...state.items, { product, quantity }] };
        });

        if (user && isSupabaseConfigured) {
          try {
            set({ isSyncing: true });
            let cartId = get().cartId;

            if (!cartId) {
              const { data: cart } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

              if (cart) {
                cartId = cart.id;
                set({ cartId });
              } else {
                const { data: newCart, error: cartErr } = await supabase
                  .from("carts")
                  .insert({ user_id: user.id })
                  .select("id")
                  .single();

                if (cartErr) throw cartErr;
                cartId = newCart.id;
                set({ cartId });
              }
            }

            const existing = get().items.find(
              (item) => String(item.product.id) === String(product.id)
            );
            const newQty = existing ? existing.quantity : quantity;

            const { error } = await supabase
              .from("cart_items")
              .upsert(
                {
                  cart_id: cartId,
                  product_id: String(product.id),
                  quantity: newQty,
                },
                { onConflict: "cart_id,product_id" }
              );

            if (error) throw error;
          } catch (err) {
            console.log("Failed to sync cart addItem", err);
          } finally {
            set({ isSyncing: false });
          }
        }
      },

      removeItem: async (productId) => {
        const user = useAuthStore.getState().user;
        set((state) => ({
          items: state.items.filter((item) => String(item.product.id) !== String(productId)),
        }));

        if (user && isSupabaseConfigured && get().cartId) {
          try {
            set({ isSyncing: true });
            await supabase
              .from("cart_items")
              .delete()
              .eq("cart_id", get().cartId)
              .eq("product_id", String(productId));
          } catch (err) {
            console.log("Failed to sync cart removeItem", err);
          } finally {
            set({ isSyncing: false });
          }
        }
      },

      setQuantity: async (productId, quantity) => {
        const user = useAuthStore.getState().user;

        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => String(item.product.id) !== String(productId))
              : state.items.map((item) =>
                  String(item.product.id) === String(productId) ? { ...item, quantity } : item
                ),
        }));

        if (user && isSupabaseConfigured && get().cartId) {
          try {
            set({ isSyncing: true });
            if (quantity <= 0) {
              await supabase
                .from("cart_items")
                .delete()
                .eq("cart_id", get().cartId)
                .eq("product_id", String(productId));
            } else {
              await supabase
                .from("cart_items")
                .upsert(
                  {
                    cart_id: get().cartId,
                    product_id: String(productId),
                    quantity,
                  },
                  { onConflict: "cart_id,product_id" }
                );
            }
          } catch (err) {
            console.log("Failed to sync cart setQuantity", err);
          } finally {
            set({ isSyncing: false });
          }
        }
      },

      clear: async () => {
        const user = useAuthStore.getState().user;
        set({ items: [] });

        if (user && isSupabaseConfigured && get().cartId) {
          try {
            set({ isSyncing: true });
            await supabase.from("cart_items").delete().eq("cart_id", get().cartId);
          } catch (err) {
            console.log("Failed to sync cart clear", err);
          } finally {
            set({ isSyncing: false });
          }
        }
      },

      loadFromSupabase: async (userId: string) => {
        if (!isSupabaseConfigured) return;
        try {
          set({ isSyncing: true });

          const { data: cart } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          let cartId = cart?.id || null;

          if (!cartId) {
            const { data: newCart } = await supabase
              .from("carts")
              .insert({ user_id: userId })
              .select("id")
              .single();
            cartId = newCart?.id || null;
          }

          set({ cartId });

          if (!cartId) return;

          const { data: cartItems, error } = await supabase
            .from("cart_items")
            .select(
              `
              quantity,
              product_id,
              products (
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
                categories (slug, name),
                product_images (url, position)
              )
            `
            )
            .eq("cart_id", cartId);

          if (error) throw error;

          const items: CartItem[] = [];
          (cartItems || []).forEach((ci: any) => {
            const mapped = mapCartItem(ci);
            if (mapped) items.push(mapped);
          });

          set({ items });
        } catch (err) {
          console.log("Failed to load cart from Supabase", err);
        } finally {
          set({ isSyncing: false });
        }
      },

      syncFromLocalToSupabase: async (userId: string) => {
        if (!isSupabaseConfigured) return;
        const localItems = get().items;
        if (localItems.length === 0) {
          await get().loadFromSupabase(userId);
          return;
        }

        try {
          set({ isSyncing: true });

          const { data: cart } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          let cartId = cart?.id || null;

          if (!cartId) {
            const { data: newCart } = await supabase
              .from("carts")
              .insert({ user_id: userId })
              .select("id")
              .single();
            cartId = newCart?.id || null;
          }

          set({ cartId });
          if (!cartId) return;

          const payload = localItems.map((item) => ({
            cart_id: cartId,
            product_id: String(item.product.id),
            quantity: item.quantity,
          }));

          const { error } = await supabase
            .from("cart_items")
            .upsert(payload, { onConflict: "cart_id,product_id" });

          if (error) throw error;

          await get().loadFromSupabase(userId);
        } catch (err) {
          console.log("Failed to sync local cart to Supabase", err);
        } finally {
          set({ isSyncing: false });
        }
      },

      reset: () => set({ items: [], cartId: null, isSyncing: false }),
    }),
    {
      name: "shopcart-cart",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
