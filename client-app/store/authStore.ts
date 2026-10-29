import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { create } from "zustand";

const NOT_CONFIGURED =
  "Supabase is not configured yet. Add your project URL and anon key to .env.";

export interface User {
  id: string;
  email: string;
}
interface AuthState {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  error: string | null;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  initialized: false,
  error: null,

  //   Login with email and password
  login: async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      set({ error: NOT_CONFIGURED, initialized: true });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data && data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || "",
          },
          isLoading: false,
          initialized: true,
        });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false, initialized: true });
    }
  },
  signup: async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      set({ error: NOT_CONFIGURED, initialized: true });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      if (data && data.user) {
        set({
          user: { id: data.user.id, email: data.user.email || "" },
          isLoading: false,
          initialized: true,
        });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false, initialized: true });
    }
  },
  logout: async () => {
    if (!isSupabaseConfigured) {
      set({ user: null, error: null, initialized: true });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, isLoading: false, initialized: true });
    } catch (error: any) {
      set({ error: error.message, isLoading: false, initialized: true });
    }
  },
  checkSession: async () => {
    if (!isSupabaseConfigured) {
      set({ user: null, error: null, initialized: true });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data && data.session) {
        const { user } = data.session;
        set({
          user: {
            id: user.id,
            email: user.email || "",
          },
          isLoading: false,
          initialized: true,
        });
      } else {
        set({ user: null, isLoading: false, initialized: true });
      }
    } catch (error: any) {
      set({ user: null, error: error.message, isLoading: false, initialized: true });
    }
  },
}));
