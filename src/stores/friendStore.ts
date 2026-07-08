import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "./authStore";
import type { Friend, FriendRequest } from "@/types/friend";

function generateId(): string {
  return crypto.randomUUID();
}

interface FriendStore {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  syncStatus: "idle" | "syncing" | "synced" | "error";

  // Sync
  syncFromSupabase: () => Promise<void>;

  // Search
  searchUsers: (query: string) => Promise<{ id: string; name: string; username: string; avatar?: string }[]>;

  // Friend requests
  sendRequest: (receiverId: string) => Promise<{ error?: string }>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;

  // Friends
  removeFriend: (friendId: string) => Promise<void>;
  getFriend: (userId: string) => Friend | undefined;

  // Reset
  reset: () => void;
}

export const useFriendStore = create<FriendStore>()(
  persist(
    (set, get) => ({
      friends: [],
      incomingRequests: [],
      outgoingRequests: [],
      syncStatus: "idle",

      syncFromSupabase: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        set({ syncStatus: "syncing" });

        try {
          // ── Friends (bidirectional) ──
          const [friendsRes1, friendsRes2] = await Promise.all([
            supabase
              .from("friends")
              .select("id, user_id, friend_id, created_at, profiles!friends_friend_id_fkey(name, username, avatar_url, phone)")
              .eq("user_id", user.id),
            supabase
              .from("friends")
              .select("id, user_id, friend_id, created_at, profiles!friends_user_id_fkey(name, username, avatar_url, phone)")
              .eq("friend_id", user.id),
          ]);

          const friendsList: Friend[] = [
            ...(friendsRes1.data || []).map((r: Record<string, unknown>) => {
              const p = (r.profiles as Record<string, unknown>) || {};
              return {
                id: r.id as string,
                userId: r.user_id as string,
                friendId: r.friend_id as string,
                createdAt: r.created_at as string,
                name: p.name as string,
                username: p.username as string,
                avatar: p.avatar_url as string,
                phone: p.phone as string,
              };
            }),
            ...(friendsRes2.data || []).map((r: Record<string, unknown>) => {
              const p = (r.profiles as Record<string, unknown>) || {};
              return {
                id: r.id as string,
                userId: r.user_id as string,
                friendId: r.friend_id as string,
                createdAt: r.created_at as string,
                name: p.name as string,
                username: p.username as string,
                avatar: p.avatar_url as string,
                phone: p.phone as string,
              };
            }),
          ];

          // Deduplicate by friend's user ID (the "other" person)
          const seen = new Set<string>();
          const dedupedFriends: Friend[] = [];
          for (const f of friendsList) {
            const otherId = f.userId === user.id ? f.friendId : f.userId;
            if (!seen.has(otherId)) {
              seen.add(otherId);
              dedupedFriends.push(f);
            }
          }

          // ── Friend Requests ──
          const [incomingRes, outgoingRes] = await Promise.all([
            supabase
              .from("friend_requests")
              .select("id, sender_id, receiver_id, status, created_at, sender:profiles!friend_requests_sender_id_fkey(name, username, avatar_url)")
              .eq("receiver_id", user.id)
              .eq("status", "pending"),
            supabase
              .from("friend_requests")
              .select("id, sender_id, receiver_id, status, created_at, receiver:profiles!friend_requests_receiver_id_fkey(name, username, avatar_url)")
              .eq("sender_id", user.id)
              .eq("status", "pending"),
          ]);

          set({
            friends: dedupedFriends,
            incomingRequests: (incomingRes.data || []).map((r: Record<string, unknown>) => {
              const s = (r.sender as Record<string, unknown>) || {};
              return {
                id: r.id as string,
                senderId: r.sender_id as string,
                receiverId: r.receiver_id as string,
                status: r.status as "pending",
                createdAt: r.created_at as string,
                name: s.name as string,
                username: s.username as string,
                avatar: s.avatar_url as string,
              };
            }),
            outgoingRequests: (outgoingRes.data || []).map((r: Record<string, unknown>) => {
              const rec = (r.receiver as Record<string, unknown>) || {};
              return {
                id: r.id as string,
                senderId: r.sender_id as string,
                receiverId: r.receiver_id as string,
                status: r.status as "pending",
                createdAt: r.created_at as string,
                name: rec.name as string,
                username: rec.username as string,
                avatar: rec.avatar_url as string,
              };
            }),
            syncStatus: "synced",
          });
        } catch (e) {
          console.error("Failed to sync friends:", e);
          set({ syncStatus: "error" });
        }
      },

      searchUsers: async (query) => {
        const user = useAuthStore.getState().user;
        if (!query.trim() || !user) return [];

        try {
          const { data } = await supabase
            .from("profiles")
            .select("id, name, username, avatar_url")
            .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
            .neq("id", user.id)  // exclude self
            .limit(20);

          return (data || []).map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: p.name as string,
            username: p.username as string,
            avatar: p.avatar_url as string,
          }));
        } catch {
          return [];
        }
      },

      sendRequest: async (receiverId) => {
        const user = useAuthStore.getState().user;
        if (!user) return { error: "Необходимо авторизоваться" };

        // Check if already friends
        if (get().friends.some((f) => {
          const otherId = f.userId === user.id ? f.friendId : f.userId;
          return otherId === receiverId;
        })) {
          return { error: "Вы уже друзья" };
        }

        const id = generateId();
        const newRequest: FriendRequest = {
          id, senderId: user.id, receiverId,
          status: "pending", createdAt: new Date().toISOString(),
        };

        set((s) => ({ outgoingRequests: [...s.outgoingRequests, newRequest] }));

        try {
          await supabase.from("friend_requests").insert({
            id, sender_id: user.id, receiver_id: receiverId,
          });
        } catch (e) {
          // Remove optimistic request on failure
          set((s) => ({
            outgoingRequests: s.outgoingRequests.filter((r) => r.id !== id),
          }));
          return { error: "Не удалось отправить заявку. Возможно, вы уже отправляли." };
        }

        return {};
      },

      acceptRequest: async (requestId) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const request = get().incomingRequests.find((r) => r.id === requestId);
        if (!request) return;

        const friendId = generateId();

        // Optimistic: move from incoming to friends
        set((s) => ({
          friends: [
            ...s.friends,
            {
              id: friendId,
              userId: user.id,
              friendId: request.senderId,
              createdAt: new Date().toISOString(),
              name: request.name,
              username: request.username,
              avatar: request.avatar,
            },
          ],
          incomingRequests: s.incomingRequests.filter((r) => r.id !== requestId),
        }));

        try {
          await Promise.all([
            supabase.from("friend_requests").update({ status: "accepted" })
              .eq("id", requestId),
            supabase.from("friends").insert({
              id: friendId, user_id: user.id, friend_id: request.senderId,
            }),
          ]);
        } catch (e) {
          console.error("Failed to accept friend request:", e);
          // Rollback optimistic update on failure
          set((s) => ({
            friends: s.friends.filter((f) => f.id !== friendId),
            incomingRequests: [...s.incomingRequests, request],
          }));
        }
      },

      rejectRequest: async (requestId) => {
        const request = get().incomingRequests.find((r) => r.id === requestId);
        if (!request) return;

        // Optimistic remove
        set((s) => ({
          incomingRequests: s.incomingRequests.filter((r) => r.id !== requestId),
        }));

        try {
          await supabase.from("friend_requests").update({ status: "rejected" })
            .eq("id", requestId);
        } catch (e) {
          console.error("Failed to reject friend request:", e);
          set((s) => ({
            incomingRequests: [...s.incomingRequests, request],
          }));
        }
      },

      cancelRequest: async (requestId) => {
        set((s) => ({
          outgoingRequests: s.outgoingRequests.filter((r) => r.id !== requestId),
        }));

        try {
          await supabase.from("friend_requests").delete().eq("id", requestId);
        } catch (e) {
          console.error("Failed to cancel request:", e);
        }
      },

      removeFriend: async (friendId) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const friend = get().friends.find((f) => f.id === friendId);
        if (!friend) return;

        // Optimistic remove
        set((s) => ({
          friends: s.friends.filter((f) => f.id !== friendId),
        }));

        try {
          // Delete the friendship row (either direction)
          await supabase
            .from("friends")
            .delete()
            .or(`and(user_id.eq.${user.id},friend_id.eq.${friend.friendId}),and(user_id.eq.${friend.friendId},friend_id.eq.${user.id})`);
        } catch (e) {
          console.error("Failed to remove friend:", e);
          set((s) => ({
            friends: [...s.friends, friend],
          }));
        }
      },

      getFriend: (userId) => {
        const user = useAuthStore.getState().user;
        if (!user) return undefined;
        return get().friends.find((f) => {
          const otherId = f.userId === user.id ? f.friendId : f.userId;
          return otherId === userId;
        });
      },

      reset: () => {
        set({
          friends: [], incomingRequests: [], outgoingRequests: [],
          syncStatus: "idle",
        });
      },
    }),
    {
      name: "qaryz-friends",
      partialize: (state) => ({
        friends: state.friends,
      }),
    }
  )
);
