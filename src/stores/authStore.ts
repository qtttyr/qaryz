import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "./userStore";
import { useFriendStore } from "./friendStore";
import { useDebtStore } from "./debtStore";
import { useGroupStore } from "./groupStore";
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
  deleteAccount: () => Promise<{ error?: string }>;
  syncProfile: () => Promise<void>;
  updateProfile: (userId: string, data: { name?: string; username?: string; phone?: string; avatar_url?: string | null }) => Promise<{ error?: string }>;
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
        const store = useAuthStore.getState();
        await store.syncProfile();
        // Sync friends + debts + groups after profile
        useFriendStore.getState().syncFromSupabase();
        useDebtStore.getState().syncFromSupabase();
        useGroupStore.getState().syncFromSupabase();
      } else {
        set({ user: null, session: null, state: "unauthenticated" });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          set({ user: session.user, session, state: "authenticated" });
          const store = useAuthStore.getState();
          await store.syncProfile();
          useFriendStore.getState().syncFromSupabase();
          useDebtStore.getState().syncFromSupabase();
          useGroupStore.getState().syncFromSupabase();
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
        .select("name, username, avatar_url, phone, currency, language")
        .eq("id", currentUser.id)
        .single();

      if (profile) {
        const update: Partial<UserProfile> = {
          id: currentUser.id,
          name: profile.name || (currentUser.user_metadata?.name as string) || "Пользователь",
          username: profile.username || currentUser.email?.split("@")[0] || "user",
          currency: (profile.currency as "KZT" | "RUB" | "USD") || "KZT",
          language: (profile.language as "ru" | "en") || "ru",
        };
        update.avatar = profile.avatar_url || undefined;
        update.phone = profile.phone || undefined;
        useUserStore.getState().updateProfile(update);

        // If profile exists with a non-auto-generated username → already onboarded
        if (profile.username && !/^user_[a-f0-9]{8}$/i.test(profile.username)) {
          localStorage.setItem("qaryz-onboarded", "true");
        }
      } else {
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
      // Silent fail
    }
  },

  /** Update profile fields in Supabase + local store */
  updateProfile: async (userId, data): Promise<{ error?: string }> => {
    // If changing username, check for duplicates first
    if (data.username !== undefined && data.username.trim()) {
      try {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", data.username.trim())
          .neq("id", userId)
          .maybeSingle();
        if (existing) {
          return { error: "Этот username уже занят" };
        }
      } catch {
        return { error: "Не удалось проверить username" };
      }
    }

    // Update local store optimistically
    const upd: Partial<UserProfile> = {};
    if (data.name !== undefined) upd.name = data.name;
    if (data.username !== undefined) upd.username = data.username;
    if (data.phone !== undefined) upd.phone = data.phone;
    if (data.avatar_url !== undefined) upd.avatar = data.avatar_url ?? undefined;
    if (Object.keys(upd).length > 0) {
      useUserStore.getState().updateProfile({ ...upd, id: userId });
    }

    // Persist to Supabase
    try {
      const dbData: Record<string, string | null> = {};
      if (data.name !== undefined) dbData.name = data.name;
      if (data.username !== undefined) dbData.username = data.username;
      if (data.phone !== undefined) dbData.phone = data.phone;
      if (data.avatar_url !== undefined) dbData.avatar_url = data.avatar_url;

      await supabase.from("profiles").upsert(
        { id: userId, ...dbData },
        { onConflict: "id" }
      );
    } catch (e) {
      console.error("Failed to update profile in Supabase:", e);
      return { error: "Не удалось сохранить в базу данных" };
    }

    return {};
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
    await useAuthStore.getState().syncProfile();
    useFriendStore.getState().syncFromSupabase();
    useDebtStore.getState().syncFromSupabase();
    useGroupStore.getState().syncFromSupabase();
    return {};
  },

  signOut: async () => {
    await supabase.auth.signOut();
    // Clear all local data
    const keys = ["qaryz-debts", "qaryz-user", "qaryz-friends", "qaryz-groups"];
    for (const k of keys) localStorage.removeItem(k);
    useFriendStore.getState().reset();
    set({ user: null, session: null, state: "unauthenticated" });
  },

  setSession: (session) => {
    set({
      user: session?.user ?? null,
      session,
      state: session ? "authenticated" : "unauthenticated",
    });
  },

  deleteAccount: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return { error: "Не авторизован" };

    try {
      // 1. Delete payments
      await supabase.from("payments").delete().eq("user_id", user.id);
      // 2. Delete debts
      await supabase.from("debts").delete().eq("user_id", user.id);
      // 3. Delete persons
      await supabase.from("persons").delete().eq("user_id", user.id);
      // 4. Delete friends where user is user_id or friend_id
      await supabase.from("friends").delete().or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      // 5. Delete friend requests
      await supabase.from("friend_requests").delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      // 6. Delete shared debts
      await supabase.from("shared_debts").delete().or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
      // 7. Handle groups — delete groups where created_by = user, leave others
      const { data: ownedGroups } = await supabase.from("groups").select("id").eq("created_by", user.id);
      if (ownedGroups && ownedGroups.length > 0) {
        const ownedIds = ownedGroups.map((g: Record<string, unknown>) => g.id as string);
        // Delete shares for owned group expenses
        const { data: ownedExpenses } = await supabase.from("expenses").select("id").in("group_id", ownedIds);
        if (ownedExpenses && ownedExpenses.length > 0) {
          const expIds = ownedExpenses.map((e: Record<string, unknown>) => e.id as string);
          await supabase.from("expense_shares").delete().in("expense_id", expIds);
        }
        await supabase.from("expenses").delete().in("group_id", ownedIds);
        await supabase.from("group_members").delete().in("group_id", ownedIds);
        await supabase.from("groups").delete().in("id", ownedIds);
      }
      // 8. For groups where user is member but not creator — just remove membership
      await supabase.from("group_members").delete().eq("user_id", user.id);
      // 9. Delete push subscriptions
      await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
      // 10. Delete avatar from storage
      try {
        await supabase.storage.from("avatars").remove([`${user.id}/avatar.webp`]);
      } catch { /* ignore if no avatar */ }
      // 11. Delete profile
      await supabase.from("profiles").delete().eq("id", user.id);
      // 12. Delete the auth user itself (requires admin — use Edge Function)
      try {
        await supabase.rpc("delete_user");
      } catch (e) {
        console.warn("Could not call delete_user RPC, auth user may remain:", e);
      }
      // 13. Sign out + clear local data
      await supabase.auth.signOut();
      const keys = ["qaryz-debts", "qaryz-user", "qaryz-friends", "qaryz-groups", "qaryz-consent", "qaryz-ui"];
      for (const k of keys) localStorage.removeItem(k);
      useFriendStore.getState().reset();
      set({ user: null, session: null, state: "unauthenticated" });
      return {};
    } catch (e) {
      console.error("deleteAccount error:", e);
      return { error: "Не удалось удалить аккаунт. Попробуйте позже." };
    }
  },
}));
