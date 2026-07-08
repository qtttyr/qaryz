import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "./authStore";
import { useDebtStore } from "./debtStore";
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

  createGroup(name: string, emoji?: string, description?: string): Promise<string>;
  deleteGroup(groupId: string): Promise<void>;

  joinByInvite(inviteCode: string): Promise<{ error?: string }>;
  leaveGroup(groupId: string): Promise<void>;

  getMembers(groupId: string): GroupMember[];

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

// ── Helper: ensure a Person exists in debtStore for a group member ──
async function ensurePersonForUser(
  userId: string,
  displayName: string
): Promise<string> {
  const debtStore = useDebtStore.getState();

  // Check Person with this id exists
  const existing = debtStore.people.find((p) => p.id === userId);
  if (existing) return existing.id;

  // Create a new Person with id = userId
  const newPerson = {
    id: userId,
    name: displayName,
    createdAt: new Date().toISOString(),
  };

  debtStore.setData({
    debts: useDebtStore.getState().debts,
    payments: useDebtStore.getState().payments,
    people: [...useDebtStore.getState().people, newPerson],
  });

  const user = useAuthStore.getState().user;
  if (user) {
    try {
      await supabase.from("persons").insert({
        id: userId,
        user_id: user.id,
        name: displayName,
      });
    } catch (e) {
      // Person may already exist — ignore
      if ((e as { code?: string })?.code !== "23505") {
        console.error("Failed to create person in Supabase:", e);
      }
    }
  }

  return userId;
}

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: [],
      members: [],
      expenses: [],
      shares: [],
      syncStatus: "idle",

      createGroup: async (name, emoji, description) => {
        const id = generateId();
        const user = useAuthStore.getState().user;
        if (!user) throw new Error("Not authenticated");

        const newGroup: Group = {
          id, name, emoji: emoji || "👥", description,
          createdBy: user.id, inviteCode: id.slice(0, 6).toUpperCase(),
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };

        const memberId = generateId();
        const newMember: GroupMember = {
          id: memberId, groupId: id, userId: user.id, joinedAt: new Date().toISOString(),
        };

        set((s) => ({ groups: [...s.groups, newGroup], members: [...s.members, newMember] }));

        try {
          await supabase.from("groups").insert({
            id, name, emoji: emoji || "👥", description: description || null,
            created_by: user.id, invite_code: newGroup.inviteCode,
          });
          await supabase.from("group_members").insert({
            id: memberId, group_id: id, user_id: user.id,
          });
        } catch (e) {
          console.error("Failed to save group to Supabase:", e);
          // Group exists locally — will be preserved by merge in syncFromSupabase
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
        set((s) => ({
          members: s.members.filter((m) => !(m.groupId === groupId && m.userId === user.id)),
        }));
        await supabase.from("group_members").delete()
          .eq("group_id", groupId).eq("user_id", user.id);
      },

      getMembers(groupId) {
        return get().members.filter((m) => m.groupId === groupId);
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

        // ── Create debts for each share where user ≠ payer ──
        const allMembers = get().members.filter((m) => m.groupId === groupId);
        const nameMap: Record<string, string> = {};
        for (const m of allMembers) {
          nameMap[m.userId] = m.nickname || m.name || "Пользователь";
        }
        const groupName = get().groups.find((g) => g.id === groupId)?.name || "";

        for (const share of newShares) {
          if (share.userId !== paidBy && user) {
            const personName = nameMap[share.userId] || "Пользователь";
            const personId = await ensurePersonForUser(share.userId, personName);

            const direction = paidBy === user.id ? "owed_to_me" : "i_owe";
            try {
              await useDebtStore.getState().addDebt({
                personId,
                direction,
                amount: share.shareAmount,
                description: `${groupName}: ${description}`,
              });
            } catch (e) {
              console.error("Failed to create debt from expense:", e);
            }
          }
        }
      },

      deleteExpense: async (expenseId) => {
        set((s) => ({
          expenses: s.expenses.filter((e) => e.id !== expenseId),
          shares: s.shares.filter((sh) => sh.expenseId !== expenseId),
        }));
        try {
          await supabase.from("expenses").delete().eq("id", expenseId);
        } catch (e) {
          console.error("Failed to delete expense in Supabase:", e);
        }
      },

      getExpenses(groupId) {
        return get().expenses
          .filter((e) => e.groupId === groupId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
            const [groupsRes, membersRes, expensesRes, sharesRes] = await Promise.all([
              supabase.from("groups").select("*").in("id", groupIds),
              supabase.from("group_members").select("*, profiles(name, avatar_url)").in("group_id", groupIds),
              supabase.from("expenses").select("*").in("group_id", groupIds),
              supabase.from("expense_shares").select("*"),
            ]);

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

            const serverMembers: GroupMember[] = (membersRes.data || []).map((m: Record<string, unknown>) => {
              const p = m.profiles as Record<string, unknown> | undefined;
              return {
                id: m.id as string, groupId: m.group_id as string,
                userId: m.user_id as string, nickname: (m.nickname as string) || undefined,
                joinedAt: m.joined_at as string,
                name: p?.name as string, avatarUrl: p?.avatar_url as string,
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

            const mergedGroups = [
              ...serverGroups,
              ...localState.groups.filter((g) => !serverGroupIdSet.has(g.id)),
            ];
            const mergedMembers = [
              ...serverMembers,
              ...localState.members.filter((m) => !serverGroupIdSet.has(m.groupId)),
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
