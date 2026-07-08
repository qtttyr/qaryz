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
  const members = useGroupStore((s) => s.members.filter((m) => m.groupId === groupId));
  const getExpenses = useGroupStore((s) => s.getExpenses);
  const getGroupBalance = useGroupStore((s) => s.getGroupBalance);
  const getGroupTotal = useGroupStore((s) => s.getGroupTotal);

  const expenses = getExpenses(groupId);

  return {
    group,
    members,
    expenses,
    balances: getGroupBalance(groupId),
    total: getGroupTotal(groupId),
  };
}
