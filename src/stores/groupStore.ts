import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "./authStore";
import { useUserStore } from "./userStore";
import type { Group, GroupMember, Expense, ExpenseShare } from "@/types/group";

function generateId(): string {
  return crypto.randomUUID();
}

interface GroupStore {
  groups: Group[];
  members: GroupMember[];
  expenses: Expense[];
  shares: ExpenseShare[];
  syncStatus: "idle" | "syncing" | "synced" | "error";

  createGroup(name: string, emoji?: string, description?: string, photo?: string): Promise<string>;
  deleteGroup(groupId: string): Promise<void>;

  joinByInvite(inviteCode: string): Promise<{ error?: string }>;
  leaveGroup(groupId: string): Promise<void>;

  getMembers(groupId: string): GroupMember[];
  addMemberLocally(groupId: string, userId: string, memberId?: string, name?: string, avatarUrl?: string): void;

  addExpense(
    groupId: string,
    paidBy: string,
    amount: number,
    description: string,
    category: string,
    splitMode: "equal" | "custom",
    shares: { userId: string; amount: number }[]
  ): Promise<void>;
  deleteExpense(expenseId: string): Promise<void>;
  getExpenses(groupId: string): Expense[];
  getShares(expenseId: string): ExpenseShare[];

  getGroupBalance(groupId: string): { userId: string; balance: number; name: string }[];
  getGroupTotal(groupId: string): number;

  syncFromSupabase: () => Promise<void>;
}

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: [],
      members: [],
      expenses: [],
      shares: [],
      syncStatus: "idle",

      createGroup: async (name, emoji, description, photo, invitedFriendIds?: string[]) => {
        const id = generateId();
        const user = useAuthStore.getState().user;
        if (!user) throw new Error("Not authenticated");

        const newGroup: Group = {
          id, name, emoji: emoji || "👥", description, photo,
          createdBy: user.id, inviteCode: id.slice(0, 6).toUpperCase(),
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };

        const memberId = generateId();
        const creatorName = useUserStore.getState().profile.name || user.user_metadata?.name as string || "Пользователь";
        const newMember: GroupMember = {
          id: memberId, groupId: id, userId: user.id,
          name: creatorName,
          joinedAt: new Date().toISOString(),
        };

        // Build invited member records
        const invitedMembers: GroupMember[] = (invitedFriendIds || []).map((friendId) => ({
          id: generateId(), groupId: id, userId: friendId,
          name: "Пользователь",
          joinedAt: new Date().toISOString(),
        }));

        set((s) => ({
          groups: [...s.groups, newGroup],
          members: [...s.members, newMember, ...invitedMembers],
        }));

        // Save to Supabase (best-effort — group already saved locally)
        try {
          const groupPayload: Record<string, unknown> = {
            id, name, emoji: emoji || "👥", created_by: user.id,
            invite_code: newGroup.inviteCode,
          };
          if (description) groupPayload.description = description;
          if (photo) groupPayload.photo = photo;
          await supabase.from("groups").insert(groupPayload);

          // Save creator as member
          await supabase.from("group_members").insert({
            id: memberId, group_id: id, user_id: user.id,
          });

          // Save invited friends as members
          for (const m of invitedMembers) {
            await supabase.from("group_members").insert({
              id: m.id, group_id: id, user_id: m.userId,
            });
          }
        } catch (e) {
          console.warn("Could not save group to Supabase (will retry on sync):", (e as {message?: string})?.message);
        }

        return id;
      },

      deleteGroup: async (groupId) => {
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== groupId),
          members: s.members.filter((m) => m.groupId !== groupId),
          expenses: s.expenses.filter((e) => e.groupId !== groupId),
          shares: s.shares.filter((sh) =>
            !s.expenses.some((e) => e.groupId === groupId && e.id === sh.expenseId)
          ),
        }));
        try {
          await supabase.from("groups").delete().eq("id", groupId);
        } catch (e) {
          console.error("Failed to delete group in Supabase:", e);
        }
      },

      joinByInvite: async (inviteCode) => {
        const user = useAuthStore.getState().user;
        if (!user) return { error: "Необходимо авторизоваться" };

        const { data: group, error: findError } = await supabase
          .from("groups").select("id, name")
          .eq("invite_code", inviteCode.toUpperCase()).single();
        if (findError || !group) return { error: "Группа не найдена" };
        if (get().members.some((m) => m.groupId === group.id && m.userId === user.id))
          return { error: "Вы уже в этой группе" };

        const memberId = generateId();
        set((s) => ({
          members: [...s.members, {
            id: memberId, groupId: group.id, userId: user.id, joinedAt: new Date().toISOString(),
          }],
        }));
        await supabase.from("group_members").insert({
          id: memberId, group_id: group.id, user_id: user.id,
        });
        await get().syncFromSupabase();
        return {};
      },

      leaveGroup: async (groupId) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const group = get().groups.find((g) => g.id === groupId);
        const isCreator = group?.createdBy === user.id;

        if (isCreator) {
          // Creator leaving = delete the whole group
          const expenseIds = get().expenses
            .filter((e) => e.groupId === groupId)
            .map((e) => e.id);

          set((s) => ({
            groups: s.groups.filter((g) => g.id !== groupId),
            members: s.members.filter((m) => m.groupId !== groupId),
            expenses: s.expenses.filter((e) => e.groupId !== groupId),
            shares: s.shares.filter((sh) => !expenseIds.includes(sh.expenseId)),
          }));
          try {
            if (expenseIds.length > 0) {
              await supabase.from("expense_shares").delete().in("expense_id", expenseIds);
              await supabase.from("expenses").delete().eq("group_id", groupId);
            }
            await supabase.from("group_members").delete().eq("group_id", groupId);
            await supabase.from("groups").delete().eq("id", groupId);
          } catch (e) {
            console.error("Failed to delete group from Supabase:", e);
          }
        } else {
          // Regular member leaving — remove group + membership from local state
          set((s) => ({
            groups: s.groups.filter((g) => g.id !== groupId),
            members: s.members.filter((m) => !(m.groupId === groupId && m.userId === user.id)),
          }));
          try {
            await supabase.from("group_members").delete()
              .eq("group_id", groupId).eq("user_id", user.id);
          } catch (e) {
            console.error("Failed to remove member from Supabase:", e);
          }
        }
      },

      getMembers(groupId) {
        return get().members.filter((m) => m.groupId === groupId);
      },

      addMemberLocally(groupId, userId, memberId, name, avatarUrl) {
        const id = memberId || generateId();
        const existing = get().members.find(
          (m) => m.groupId === groupId && m.userId === userId
        );
        if (existing) return;
        const newMember: GroupMember = {
          id, groupId, userId, name, avatarUrl,
          joinedAt: new Date().toISOString(),
        };
        set((s) => ({ members: [...s.members, newMember] }));
      },

      addExpense: async (groupId, paidBy, amount, description, category, splitMode, shares) => {
        const id = generateId();
        const user = useAuthStore.getState().user;
        if (!user) throw new Error("Not authenticated");

        const newExpense: Expense = {
          id, groupId, paidBy, amount, description, category, splitMode,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };

        const newShares: ExpenseShare[] = shares.map((s) => ({
          id: generateId(), expenseId: id, userId: s.userId,
          shareAmount: s.amount, settled: false,
        }));

        set((state) => ({
          expenses: [...state.expenses, newExpense],
          shares: [...state.shares, ...newShares],
        }));

        try {
          await supabase.from("expenses").insert({
            id, group_id: groupId, paid_by: paidBy, amount,
            description, category, split_mode: splitMode,
          });
          await supabase.from("expense_shares").insert(
            newShares.map((s) => ({
              id: s.id, expense_id: id, user_id: s.userId, share_amount: s.shareAmount,
            }))
          );
        } catch (e) {
          console.error("Failed to save expense to Supabase:", e);
        }
      },

      deleteExpense: async (expenseId) => {
        // Get shares before removing (need IDs for Supabase)
        const expenseShares = get().shares.filter((sh) => sh.expenseId === expenseId);
        const shareIds = expenseShares.map((s) => s.id);

        // Remove locally first (instant UI update)
        set((s) => ({
          expenses: s.expenses.filter((e) => e.id !== expenseId),
          shares: s.shares.filter((sh) => sh.expenseId !== expenseId),
        }));

        // Remove from Supabase (best-effort)
        try {
          if (shareIds.length > 0) {
            await supabase.from("expense_shares").delete().in("id", shareIds);
          }
          await supabase.from("expenses").delete().eq("id", expenseId);
        } catch (e) {
          console.error("Failed to delete expense from Supabase:", e);
        }
      },

      getExpenses(groupId) {
        return get().expenses
          .filter((e) => e.groupId === groupId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      },

      getShares(expenseId) {
        return get().shares.filter((s) => s.expenseId === expenseId);
      },

      getGroupBalance(groupId) {
        const grpExpenses = get().expenses.filter((e) => e.groupId === groupId);
        const grpMembers = get().members.filter((m) => m.groupId === groupId);
        const grpShares = get().shares.filter((s) =>
          grpExpenses.some((e) => e.id === s.expenseId)
        );

        const balances: Record<string, number> = {};
        for (const m of grpMembers) balances[m.userId] = 0;
        for (const e of grpExpenses) {
          balances[e.paidBy] = (balances[e.paidBy] || 0) + e.amount;
          for (const s of grpShares.filter((s) => s.expenseId === e.id)) {
            balances[s.userId] = (balances[s.userId] || 0) - s.shareAmount;
          }
        }

        return grpMembers.map((m) => ({
          userId: m.userId,
          balance: Math.round((balances[m.userId] || 0) * 100) / 100,
          name: m.nickname || m.name || "Пользователь",
        }));
      },

      getGroupTotal(groupId) {
        return get().expenses
          .filter((e) => e.groupId === groupId)
          .reduce((sum, e) => sum + e.amount, 0);
      },

      syncFromSupabase: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        set({ syncStatus: "syncing" });

        try {
          const localState = get();

          const { data: memberRows } = await supabase
            .from("group_members")
            .select("group_id")
            .eq("user_id", user.id);

          const groupIds = [...new Set((memberRows || []).map((r) => r.group_id as string))];

          if (groupIds.length > 0) {
            // Step 1: fetch members without embedded profiles() join (causes 400 on missing FK)
            const [groupsRes, membersRes, expensesRes, sharesRes] = await Promise.all([
              supabase.from("groups").select("*").in("id", groupIds),
              supabase.from("group_members").select("*").in("group_id", groupIds),
              supabase.from("expenses").select("*").in("group_id", groupIds),
              supabase.from("expense_shares").select("*"),
            ]);

            // Step 2: fetch profiles separately and merge into members
            const rawMembers = (membersRes.data || []) as Record<string, unknown>[];
            const userIds = [...new Set(rawMembers.map((m) => m.user_id as string))];
            const profileMap: Record<string, { name?: string; avatar_url?: string }> = {};
            if (userIds.length > 0) {
              const { data: profiles } = await supabase
                .from("profiles")
                .select("id, name, avatar_url")
                .in("id", userIds);
              for (const p of (profiles || [])) {
                profileMap[p.id as string] = p as { name?: string; avatar_url?: string };
              }
            }

            const allShares = sharesRes.data || [];
            const expenseIds = (expensesRes.data || []).map((e: Record<string, unknown>) => e.id);
            const filteredShares = allShares.filter(
              (s: Record<string, unknown>) => expenseIds.includes(s.expense_id)
            );

            // Build server data sets for merging
            const serverGroups: Group[] = (groupsRes.data || []).map((g: Record<string, unknown>) => ({
              id: g.id as string, name: g.name as string,
              description: (g.description as string) || undefined,
              emoji: (g.emoji as string) || "👥",
              createdBy: g.created_by as string,
              inviteCode: g.invite_code as string,
              createdAt: g.created_at as string,
              updatedAt: g.updated_at as string,
            }));

            const serverMembers: GroupMember[] = rawMembers.map((m) => {
              const p = profileMap[m.user_id as string] || {};
              return {
                id: m.id as string, groupId: m.group_id as string,
                userId: m.user_id as string, nickname: (m.nickname as string) || undefined,
                joinedAt: m.joined_at as string,
                name: p.name as string, avatarUrl: p.avatar_url as string,
              };
            });

            const serverExpenses: Expense[] = (expensesRes.data || []).map((e: Record<string, unknown>) => ({
              id: e.id as string, groupId: e.group_id as string,
              paidBy: e.paid_by as string, amount: Number(e.amount),
              description: e.description as string,
              category: (e.category as string) || "other",
              splitMode: (e.split_mode as "equal" | "custom") || "equal",
              createdAt: e.created_at as string, updatedAt: e.updated_at as string,
            }));

            const serverShares: ExpenseShare[] = filteredShares.map((s: Record<string, unknown>) => ({
              id: s.id as string, expenseId: s.expense_id as string,
              userId: s.user_id as string, shareAmount: Number(s.share_amount),
              settled: s.settled as boolean || false,
            }));

            // ── MERGE: source of truth = server for existing groups; keep local-only ──
            const serverGroupIdSet = new Set(serverGroups.map((g) => g.id));

            // Merge groups: server wins, but overlay local photo/description if missing on server
            const mergedGroups = [
              ...serverGroups,
              ...localState.groups.filter((g) => !serverGroupIdSet.has(g.id)),
            ].map((g) => {
              const local = localState.groups.find((lg) => lg.id === g.id);
              if (local) {
                return { ...g, photo: g.photo || local.photo };
              }
              return g;
            });
            // For members: merge server + local (local members for server groups are kept if not in server)
            const serverMemberKeySet = new Set(
              serverMembers.map((m) => `${m.groupId}:${m.userId}`)
            );
            const mergedMembers = [
              ...serverMembers,
              ...localState.members.filter((m) => {
                if (!serverGroupIdSet.has(m.groupId)) return true;
                return !serverMemberKeySet.has(`${m.groupId}:${m.userId}`);
              }),
            ];
            const mergedExpenses = [
              ...serverExpenses,
              ...localState.expenses.filter((e) => !serverGroupIdSet.has(e.groupId)),
            ];

            const serverShareIds = new Set(serverShares.map((s) => s.id));
            const mergedShares = [
              ...serverShares,
              ...localState.shares.filter((s) => !serverShareIds.has(s.id)),
            ];

            set({
              groups: mergedGroups,
              members: mergedMembers,
              expenses: mergedExpenses,
              shares: mergedShares,
              syncStatus: "synced",
            });
          } else {
            // No groups on server — keep local-only groups
            set({ syncStatus: "synced" });
          }
        } catch (e) {
          console.error("Failed to sync groups from Supabase:", e);
          set({ syncStatus: "error" });
        }
      },
    }),
    {
      name: "qaryz-groups",
      partialize: (state) => ({
        groups: state.groups, members: state.members,
        expenses: state.expenses, shares: state.shares,
      }),
    }
  )
);
