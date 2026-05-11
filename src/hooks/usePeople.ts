import { useMemo } from "react";
import { useDebtStore } from "@/stores/debtStore";

export interface PersonWithBalance {
  id: string;
  name: string;
  avatar?: string;
  balance: number; // positive = they owe me, negative = I owe them
  activeDebtsCount: number;
  lastActivity: string;
  createdAt: string;
}

export function usePeople() {
  const people = useDebtStore((s) => s.people);
  const debts = useDebtStore((s) => s.debts);
  const payments = useDebtStore((s) => s.payments);
  const getPersonBalance = useDebtStore((s) => s.getPersonBalance);
  const addPerson = useDebtStore((s) => s.addPerson);
  const removePerson = useDebtStore((s) => s.removePerson);

  const peopleWithBalances = useMemo((): PersonWithBalance[] => {
    return people.map((person) => {
      const personDebts = debts.filter((d) => d.personId === person.id);
      const activeDebts = personDebts.filter((d) => !d.settledAt);
      const personPayments = payments.filter((p) =>
        personDebts.some((d) => d.id === p.debtId)
      );

      // Find the most recent activity
      const allDates = [
        ...personDebts.map((d) => d.createdAt),
        ...personPayments.map((p) => p.createdAt),
      ];
      const lastActivity =
        allDates.length > 0
          ? allDates.sort(
              (a, b) => new Date(b).getTime() - new Date(a).getTime()
            )[0]
          : person.createdAt;

      return {
        id: person.id,
        name: person.name,
        avatar: person.avatar,
        balance: getPersonBalance(person.id),
        activeDebtsCount: activeDebts.length,
        lastActivity,
        createdAt: person.createdAt,
      };
    });
  }, [people, debts, payments, getPersonBalance]);

  const owedToMe = useMemo(
    () => peopleWithBalances.filter((p) => p.balance > 0),
    [peopleWithBalances]
  );

  const iOwe = useMemo(
    () => peopleWithBalances.filter((p) => p.balance < 0),
    [peopleWithBalances]
  );

  return {
    people: peopleWithBalances,
    owedToMe,
    iOwe,
    addPerson,
    removePerson,
  };
}
