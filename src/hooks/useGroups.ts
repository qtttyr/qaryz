import { useMemo, useEffect } from "react";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";

export function useGroups() {
  const groups = useGroupStore((s) => s.groups);
  const members = useGroupStore((s) => s.members);
  const expenses = useGroupStore((s) => s.expenses);
  const syncStatus = useGroupStore((s) => s.syncStatus);
  const syncFromSupabase = useGroupStore((s) => s.syncFromSupabase);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && syncStatus === "idle") {
      syncFromSupabase();
    }
  }, [user, syncStatus, syncFromSupabase]);

  return useMemo(() => {
    return groups.map((g) => {
      const groupMembers = members.filter((m) => m.groupId === g.id);
      const groupExpenses = expenses.filter((e) => e.groupId === g.id);
      const total = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        ...g,
        memberCount: groupMembers.length,
        expenseCount: groupExpenses.length,
        total,
      };
    });
  }, [groups, members, expenses]);
}

export function useGroupDetail(groupId: string) {
  const group = useGroupStore((s) => s.groups.find((g) => g.id === groupId));
  const allMembers = useGroupStore((s) => s.members);
  const allExpenses = useGroupStore((s) => s.expenses);
  const shares = useGroupStore((s) => s.shares);

  const syncStatus = useGroupStore((s) => s.syncStatus);
  const syncFromSupabase = useGroupStore((s) => s.syncFromSupabase);
  const user = useAuthStore((s) => s.user);

  // Sync data when opening a group page
  useEffect(() => {
    if (user && syncStatus === "idle") {
      syncFromSupabase();
    }
  }, [user, syncStatus, syncFromSupabase]);

  const result = useMemo(() => {
    const grpMembers = allMembers.filter((m) => m.groupId === groupId);
    const grpExpenses = allExpenses
      .filter((e) => e.groupId === groupId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const grpShares = shares.filter((s) =>
      grpExpenses.some((e) => e.id === s.expenseId)
    );

    // Compute balances
    const balanceMap: Record<string, number> = {};
    for (const m of grpMembers) balanceMap[m.userId] = 0;
    for (const e of grpExpenses) {
      balanceMap[e.paidBy] = (balanceMap[e.paidBy] || 0) + e.amount;
      for (const s of grpShares.filter((s) => s.expenseId === e.id)) {
        balanceMap[s.userId] = (balanceMap[s.userId] || 0) - s.shareAmount;
      }
    }

    const balances = grpMembers.map((m) => ({
      userId: m.userId,
      balance: Math.round((balanceMap[m.userId] || 0) * 100) / 100,
      name: m.nickname || m.name || "Пользователь",
    }));

    const total = grpExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { members: grpMembers, expenses: grpExpenses, balances, total };
  }, [allMembers, allExpenses, shares, groupId]);

  return { group, ...result };
}
