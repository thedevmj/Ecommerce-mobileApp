import { create } from "zustand";
import {
  Address,
  AddressInput,
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
} from "@/lib/addresses";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "./authStore";

interface AddressState {
  userId: string | null;
  addresses: Address[];
  loading: boolean;
  loaded: boolean;
  error: string | null;

  load: (force?: boolean) => Promise<void>;
  reset: () => void;
  create: (input: AddressInput) => Promise<Address>;
  update: (id: string, input: AddressInput) => Promise<Address>;
  remove: (id: string) => Promise<void>;
  makeDefault: (id: string) => Promise<void>;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  userId: null,
  addresses: [],
  loading: false,
  loaded: false,
  error: null,

  load: async (force = false) => {
    const user = useAuthStore.getState().user;
    if (!user || !isSupabaseConfigured) {
      set({
        userId: null,
        addresses: [],
        loading: false,
        loaded: true,
        error: null,
      });
      return;
    }

    const state = get();
    if (!force && state.loaded && state.userId === user.id) return;

    const requestedId = user.id;
    set({
      loading: true,
      error: null,
      ...(state.userId !== requestedId ? { addresses: [] } : null),
    });
    try {
      const addresses = await fetchAddresses(requestedId);
      if (useAuthStore.getState().user?.id !== requestedId) return;
      set({
        userId: requestedId,
        addresses,
        loading: false,
        loaded: true,
        error: null,
      });
    } catch (error: any) {
      if (useAuthStore.getState().user?.id !== requestedId) return;
      set({
        userId: requestedId,
        loading: false,
        loaded: true,
        error: error?.message || "Could not load your addresses.",
      });
    }
  },

  reset: () =>
    set({
      userId: null,
      addresses: [],
      loading: false,
      loaded: false,
      error: null,
    }),

  create: async (input) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Sign in to save an address.");

    const shouldDefault = input.isDefault || get().addresses.length === 0;
    const address = await createAddress(user.id, {
      ...input,
      isDefault: shouldDefault,
    });
    await get().load(true);
    return address;
  },

  update: async (id, input) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Sign in to edit an address.");

    const address = await updateAddress(user.id, id, input);
    await get().load(true);
    return address;
  },

  remove: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Sign in to delete an address.");

    const target = get().addresses.find((address) => address.id === id);
    await deleteAddress(user.id, id);

    if (target?.isDefault) {
      const remaining = get().addresses.filter((address) => address.id !== id);
      if (remaining.length > 0) {
        try {
          await setDefaultAddress(user.id, remaining[0].id);
        } catch {
          // Keep the first remaining address as the checkout fallback.
        }
      }
    }
    await get().load(true);
  },

  makeDefault: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Sign in to change your default address.");
    await setDefaultAddress(user.id, id);
    await get().load(true);
  },
}));

export const defaultAddress = (addresses: Address[]): Address | null =>
  addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
