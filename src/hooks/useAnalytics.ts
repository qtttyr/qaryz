import { useMemo } from "react";
import { useDebtStore } from "@/stores/debtStore";

export interface AnalyticsData {
  totalOwedToMe: number;
  totalIOwe: number;
  balance: number;
  closedDebtsCount: number;
  activeDebtsCount: number;
  totalPeople: number;
  mostFrequentDebtor: { name: string; count: number } | null;
  averageDebtAmount: number;
  biggestDebt: { amount: number; personName: string } | null;
  monthlyActivity: { month: string; created: number; settled: number }[];
}

export function useAnalytics(): AnalyticsData {
  const debts = useDebtStore((s) => s.debts);
  const payments = useDebtStore((s) => s.payments);
  const people = useDebtStore((s) => s.people);
  const getPersonBalance = useDebtStore((s) => s.getPersonBalance);

  return useMemo(() => {
    const totalOwedToMe = people.reduce((sum, p) => {
      const bal = getPersonBalance(p.id);
      return bal > 0 ? sum + bal : sum;
    }, 0);

    const totalIOwe = people.reduce((sum, p) => {
      const bal = getPersonBalance(p.id);
      return bal < 0 ? sum + Math.abs(bal) : sum;
    }, 0);

    const balance = totalOwedToMe - totalIOwe;

    const closedDebtsCount = debts.filter((d) => d.settledAt).length;
    const activeDebtsCount = debts.filter((d) => !d.settledAt).length;

    // Most frequent debtor
    const debtCountByPerson: Record<string, number> = {};
    for (const debt of debts) {
      debtCountByPerson[debt.personId] =
        (debtCountByPerson[debt.personId] || 0) + 1;
    }
    let mostFrequentDebtor: AnalyticsData["mostFrequentDebtor"] = null;
    let maxCount = 0;
    for (const [personId, count] of Object.entries(debtCountByPerson)) {
      if (count > maxCount) {
        maxCount = count;
        const person = people.find((p) => p.id === personId);
        if (person) {
          mostFrequentDebtor = { name: person.name, count };
        }
      }
    }

    // Average debt amount
    const averageDebtAmount =
      debts.length > 0
        ? debts.reduce((sum, d) => sum + d.amount, 0) / debts.length
        : 0;

    // Biggest active debt
    const activeDebts = debts.filter((d) => !d.settledAt);
    let biggestDebt: AnalyticsData["biggestDebt"] = null;
    if (activeDebts.length > 0) {
      const biggest = activeDebts.reduce((max, d) =>
        d.amount > max.amount ? d : max
      );
      const person = people.find((p) => p.id === biggest.personId);
      if (person) {
        biggestDebt = { amount: biggest.amount, personName: person.name };
      }
    }

    // Monthly activity (last 6 months)
    const monthlyActivity: AnalyticsData["monthlyActivity"] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString("ru-RU", {
        month: "short",
      });
      const year = d.getFullYear();
      const month = d.getMonth();

      const created = debts.filter((debt) => {
        const dd = new Date(debt.createdAt);
        return dd.getFullYear() === year && dd.getMonth() === month;
      }).length;

      const settled = debts.filter((debt) => {
        if (!debt.settledAt) return false;
        const dd = new Date(debt.settledAt);
        return dd.getFullYear() === year && dd.getMonth() === month;
      }).length;

      monthlyActivity.push({ month: monthStr, created, settled });
    }

    return {
      totalOwedToMe,
      totalIOwe,
      balance,
      closedDebtsCount,
      activeDebtsCount,
      totalPeople: people.length,
      mostFrequentDebtor,
      averageDebtAmount,
      biggestDebt,
      monthlyActivity,
    };
  }, [debts, payments, people, getPersonBalance]);
}
