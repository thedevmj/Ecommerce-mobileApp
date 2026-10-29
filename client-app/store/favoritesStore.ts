import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuthStore } from "./authStore";

export type FavoriteId = string | number;

type MutationResult = {
  favorite?: boolean;
  error?: string;
};

interface FavoritesState {
  ids: FavoriteId[];
  ownerId: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  toggle: (productId: FavoriteId) => Promise<MutationResult>;
  remove: (productId: FavoriteId) => Promise<MutationResult>;
  removeMany: (productIds: FavoriteId[]) => Promise<MutationResult>;
  clear: () => Promise<MutationResult>;
  syncForUser: (userId: string | null) => Promise<void>;
  retrySync: () => Promise<void>;
  reset: () => void;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (value: FavoriteId) =>
  typeof value === "string" && UUID_PATTERN.test(value);

const sameId = (a: FavoriteId, b: FavoriteId) => String(a) === String(b);

const uniqueIds = (ids: FavoriteId[]) => {
  const seen = new Set<string>();
  return ids.filter((id) => {
    const key = String(id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizePersistedState = (
  persistedState: Partial<Pick<FavoritesState, "ids" | "ownerId">> | undefined
) => ({
  ids: Array.isArray(persistedState?.ids)
    ? uniqueIds(
        persistedState.ids.filter(
          (id): id is FavoriteId =>
            typeof id === "string" || typeof id === "number"
        )
      )
    : [],
  ownerId:
    typeof persistedState?.ownerId === "string" ? persistedState.ownerId : null,
});

const errorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Please try again.";
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      ownerId: null,
      isLoading: false,
      isSyncing: false,
      error: null,

      toggle: async (productId) => {
        const state = get();
        const wasFavorite = state.ids.some((id) => sameId(id, productId));
        const nextIds = wasFavorite
          ? state.ids.filter((id) => !sameId(id, productId))
          : uniqueIds([...state.ids, productId]);

        set({ ids: nextIds, error: null });

        const user = useAuthStore.getState().user;

        if (!user || !isSupabaseConfigured || !isUuid(productId)) {
          return { favorite: !wasFavorite };
        }

        set({ isSyncing: true });

        try {
          if (wasFavorite) {
            const { error } = await supabase
              .from("favorites")
              .delete()
              .eq("user_id", user.id)
              .eq("product_id", String(productId));

            if (error) throw error;
          } else {
            const { error } = await supabase.from("favorites").upsert(
              { user_id: user.id, product_id: String(productId) },
              { onConflict: "user_id,product_id", ignoreDuplicates: true }
            );

            if (error) throw error;
          }

          set({ isSyncing: false, ownerId: user.id });
          return { favorite: !wasFavorite };
        } catch (error) {
          set((current) => ({
            ids: wasFavorite
              ? uniqueIds([...current.ids, productId])
              : current.ids.filter((id) => !sameId(id, productId)),
            isSyncing: false,
            error: errorMessage(error),
          }));

          return { favorite: wasFavorite, error: errorMessage(error) };
        }
      },

      remove: async (productId) => {
        const state = get();

        if (!state.ids.some((id) => sameId(id, productId))) {
          return { favorite: false };
        }

        const nextIds = state.ids.filter((id) => !sameId(id, productId));
        set({ ids: nextIds, error: null });

        const user = useAuthStore.getState().user;

        if (!user || !isSupabaseConfigured || !isUuid(productId)) {
          return { favorite: false };
        }

        set({ isSyncing: true });

        try {
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", String(productId));

          if (error) throw error;

          set({ isSyncing: false, ownerId: user.id });
          return { favorite: false };
        } catch (error) {
          set((current) => ({
            ids: uniqueIds([...current.ids, productId]),
            isSyncing: false,
            error: errorMessage(error),
          }));

          return { favorite: true, error: errorMessage(error) };
        }
      },

      removeMany: async (productIds) => {
        const state = get();

        if (productIds.length === 0) return {};

        const nextIds = state.ids.filter(
          (id) => !productIds.some((target) => sameId(target, id))
        );

        set({ ids: nextIds, error: null });

        const user = useAuthStore.getState().user;
        const remoteIds = productIds.filter(isUuid).map(String);

        if (!user || !isSupabaseConfigured || remoteIds.length === 0) {
          return {};
        }

        set({ isSyncing: true });

        try {
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .in("product_id", remoteIds);

          if (error) throw error;

          set({ isSyncing: false, ownerId: user.id });
          return {};
        } catch (error) {
          set((current) => ({
            ids: uniqueIds([...current.ids, ...productIds]),
            isSyncing: false,
            error: errorMessage(error),
          }));

          return { error: errorMessage(error) };
        }
      },

      clear: async () => {
        const state = get();

        if (state.ids.length === 0) return {};

        set({ ids: [], error: null });

        const user = useAuthStore.getState().user;

        if (!user || !isSupabaseConfigured) {
          return {};
        }

        set({ isSyncing: true });

        try {
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id);

          if (error) throw error;

          set({ isSyncing: false, ownerId: user.id });
          return {};
        } catch (error) {
          set((current) => ({
            ids: uniqueIds([...current.ids, ...state.ids]),
            isSyncing: false,
            error: errorMessage(error),
          }));

          return { error: errorMessage(error) };
        }
      },

      syncForUser: async (userId) => {
        if (!isSupabaseConfigured) return;

        const state = get();

        if (!userId) {
          if (state.ownerId !== null) {
            set({
              ids: [],
              ownerId: null,
              isLoading: false,
              isSyncing: false,
              error: null,
            });
          }
          return;
        }

        const switchingAccount = state.ownerId !== null && state.ownerId !== userId;
        const localIds = switchingAccount ? [] : state.ids;

        set({
          ids: switchingAccount ? [] : state.ids,
          ownerId: userId,
          isLoading: false,
          error: null,
        });

        try {
          const { data, error } = await supabase
            .from("favorites")
            .select("product_id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

          if (error) throw error;

          const serverIds: FavoriteId[] = (data ?? [])
            .map((row: { product_id?: string | null }) => row.product_id)
            .filter((id): id is string => Boolean(id));

          const merged = uniqueIds([...serverIds, ...localIds]);
          const missingOnServer = merged.filter(
            (id) =>
              isUuid(id) &&
              !serverIds.some((remoteId) => sameId(remoteId, id))
          );

          let syncWarning: string | null = null;

          if (missingOnServer.length > 0) {
            const { error: upsertError } = await supabase
              .from("favorites")
              .upsert(
                missingOnServer.map((id) => ({
                  user_id: userId,
                  product_id: String(id),
                })),
                { onConflict: "user_id,product_id", ignoreDuplicates: true }
              );

            if (upsertError) {
              syncWarning =
                "Some saved items could not be synced. Remove unavailable items and retry.";
            }
          }

          set({
            ids: merged,
            ownerId: userId,
            isLoading: false,
            isSyncing: false,
            error: syncWarning,
          });
        } catch (error) {
          set({
            ids: switchingAccount ? [] : state.ids,
            ownerId: switchingAccount ? null : state.ownerId,
            isLoading: false,
            isSyncing: false,
            error: errorMessage(error),
          });
        }
      },

      retrySync: async () => {
        const user = useAuthStore.getState().user;

        if (!user) {
          set({ error: null });
          return;
        }

        await get().syncForUser(user.id);
      },

      reset: () =>
        set({
          ids: [],
          ownerId: null,
          isLoading: false,
          isSyncing: false,
          error: null,
        }),
    }),
    {
      name: "shopcart-favorites",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        ids: state.ids,
        ownerId: state.ownerId,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedState(
          persistedState as Partial<Pick<FavoritesState, "ids" | "ownerId">>
        ),
      }),
    }
  )
);

export const isFavoriteId = (ids: FavoriteId[] | undefined, productId: FavoriteId) =>
  Array.isArray(ids) && ids.some((id) => sameId(id, productId));
