import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "./userStore";
import type { UserProfile } from "@/types/user";
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
  syncProfile: () => Promise<void>;
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
        // Sync profile from DB
        const store = useAuthStore.getState();
        await store.syncProfile();
      } else {
        set({ user: null, session: null, state: "unauthenticated" });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          set({ user: session.user, session, state: "authenticated" });
          // Sync profile on any auth change
          const store = useAuthStore.getState();
          store.syncProfile();
        } else {
          set({ user: null, session: null, state: "unauthenticated" });
        }
      });
    } catch {
      set({ user: null, session: null, state: "unauthenticated" });
    }
  },

  syncProfile: async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, username, avatar_url, currency, language")
        .eq("id", currentUser.id)
        .single();

      if (profile) {
        const update: Partial<UserProfile> = {
          name: profile.name || (currentUser.user_metadata?.name as string) || "Пользователь",
          username: profile.username || currentUser.email?.split("@")[0] || "user",
          currency: (profile.currency as "KZT" | "RUB" | "USD") || "KZT",
          language: (profile.language as "ru" | "en") || "ru",
        };
        // Only set avatar if DB has one — never override with undefined
        if (profile.avatar_url) update.avatar = profile.avatar_url;
        useUserStore.getState().updateProfile(update);
      } else {
        // No profile row yet — create one
        const name = (currentUser.user_metadata?.name as string) ||
          currentUser.email?.split("@")[0] || "Пользователь";
        const username = currentUser.email?.split("@")[0] || "user";

        const { error: insertError } = await supabase.from("profiles").insert({
          id: currentUser.id,
          name,
          username,
        });

        if (!insertError) {
          useUserStore.getState().updateProfile({
            name,
            username,
            id: currentUser.id,
          });
        }
      }
    } catch {
      // Silent fail — profile works offline
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
    // Sync profile after login
    await useAuthStore.getState().syncProfile();
    return {};
  },

  signOut: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("qaryz-debts");
    localStorage.removeItem("qaryz-user");
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
