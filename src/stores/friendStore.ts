import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "./authStore";
import { coordinatedSync } from "@/lib/syncCoordinator";
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
        await coordinatedSync("friends", async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        set({ syncStatus: "syncing" });

        try {
          // ── Friends: Step 1 — fetch raw rows (no FK joins — avoids 400) ──
          const [friendsRes1, friendsRes2] = await Promise.all([
            supabase.from("friends").select("id, user_id, friend_id, created_at").eq("user_id", user.id),
            supabase.from("friends").select("id, user_id, friend_id, created_at").eq("friend_id", user.id),
          ]);

          // Collect all "other person" user IDs + raw friend rows
          const friendIds = new Set<string>();
          const rawFriends: { id: string; userId: string; friendId: string; createdAt: string }[] = [];

          for (const r of (friendsRes1.data || [])) {
            friendIds.add(r.friend_id as string);
            rawFriends.push({ id: r.id as string, userId: r.user_id as string, friendId: r.friend_id as string, createdAt: r.created_at as string });
          }
          for (const r of (friendsRes2.data || [])) {
            friendIds.add(r.user_id as string);
            rawFriends.push({ id: r.id as string, userId: r.user_id as string, friendId: r.friend_id as string, createdAt: r.created_at as string });
          }

          // Step 2 — fetch profiles for all friend IDs
          const friendProfiles: Record<string, { name?: string; username?: string; avatar_url?: string; phone?: string }> = {};
          if (friendIds.size > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, name, username, avatar_url, phone")
              .in("id", [...friendIds]);
            for (const p of (profiles || [])) {
              friendProfiles[p.id as string] = p as { name?: string; username?: string; avatar_url?: string; phone?: string };
            }
          }

          // Step 3 — merge profiles with friend rows
          const friendsList: Friend[] = rawFriends.map((r) => {
            const otherId = r.userId === user.id ? r.friendId : r.userId;
            const p = friendProfiles[otherId] || {};
            return {
              id: r.id,
              userId: r.userId,
              friendId: r.friendId,
              createdAt: r.createdAt,
              name: p.name || "Пользователь",
              username: p.username || "user",
              avatar: p.avatar_url,
              phone: p.phone,
            };
          });

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

          // ── Friend Requests: same two-step approach ──
          const [incomingRes, outgoingRes] = await Promise.all([
            supabase.from("friend_requests").select("id, sender_id, receiver_id, status, created_at")
              .eq("receiver_id", user.id).eq("status", "pending"),
            supabase.from("friend_requests").select("id, sender_id, receiver_id, status, created_at")
              .eq("sender_id", user.id).eq("status", "pending"),
          ]);

          // Collect user IDs from requests
          const requestUserIds = new Set<string>();
          for (const r of (incomingRes.data || [])) requestUserIds.add(r.sender_id as string);
          for (const r of (outgoingRes.data || [])) requestUserIds.add(r.receiver_id as string);

          // Fetch profiles for request users
          const requestProfiles: Record<string, { name?: string; username?: string; avatar_url?: string }> = {};
          if (requestUserIds.size > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, name, username, avatar_url")
              .in("id", [...requestUserIds]);
            for (const p of (profiles || [])) {
              requestProfiles[p.id as string] = p as { name?: string; username?: string; avatar_url?: string };
            }
          }

          set({
            friends: dedupedFriends,
            incomingRequests: (incomingRes.data || []).map((r) => {
              const s = requestProfiles[r.sender_id as string] || {};
              return {
                id: r.id as string,
                senderId: r.sender_id as string,
                receiverId: r.receiver_id as string,
                status: r.status as "pending",
                createdAt: r.created_at as string,
                name: s.name || "Пользователь",
                username: s.username || "user",
                avatar: s.avatar_url,
              };
            }),
            outgoingRequests: (outgoingRes.data || []).map((r) => {
              const rec = requestProfiles[r.receiver_id as string] || {};
              return {
                id: r.id as string,
                senderId: r.sender_id as string,
                receiverId: r.receiver_id as string,
                status: r.status as "pending",
                createdAt: r.created_at as string,
                name: rec.name || "Пользователь",
                username: rec.username || "user",
                avatar: rec.avatar_url,
              };
            }),
            syncStatus: "synced",
          });
        } catch (e) {
          console.error("Failed to sync friends:", e);
          set({ syncStatus: "error" });
        }
        });
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

        // Check if already sent a request
        if (get().outgoingRequests.some((r) => r.receiverId === receiverId)) {
          return { error: "Вы уже отправили заявку этому пользователю" };
        }

        // Check if they already sent you a request
        if (get().incomingRequests.some((r) => r.senderId === receiverId)) {
          return { error: "Этот пользователь уже отправил вам заявку. Проверьте вкладку «Друзья»" };
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
        } catch (e: unknown) {
          // Remove optimistic request on failure
          set((s) => ({
            outgoingRequests: s.outgoingRequests.filter((r) => r.id !== id),
          }));
          // Postgres unique violation code 23505 = duplicate key
          const pgCode = (e as { code?: string })?.code;
          if (pgCode === "23505") {
            return { error: "Заявка уже была отправлена ранее" };
          }
          return { error: "Не удалось отправить заявку. Попробуйте позже." };
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
