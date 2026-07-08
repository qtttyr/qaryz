import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

type AuthState = "loading" | "authenticated" | "unauthenticated";

interface AuthStore {
  user: User | null;
  session: Session | null;
  state: AuthState;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  state: "loading",

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({ user: session.user, session, state: "authenticated" });
      } else {
        set({ user: null, session: null, state: "unauthenticated" });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          set({ user: session.user, session, state: "authenticated" });
        } else {
          set({ user: null, session: null, state: "unauthenticated" });
        }
      });
    } catch {
      set({ user: null, session: null, state: "unauthenticated" });
    }
  },

  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || email.split("@")[0] },
      },
    });

    if (error) return { error: error.message };
    if (data.session) {
      set({ user: data.user, session: data.session, state: "authenticated" });
    }
    return {};
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };
    set({ user: data.user, session: data.session, state: "authenticated" });
    return {};
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, state: "unauthenticated" });
  },

  setSession: (session) => {
    set({
      user: session?.user ?? null,
      session,
      state: session ? "authenticated" : "unauthenticated",
    });
  },
}));
