import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Debt, DebtDirection, Payment, Person } from "@/types/debt";

function generateId(): string {
  return crypto.randomUUID();
}

interface DebtStore {
  debts: Debt[];
  payments: Payment[];
  people: Person[];

  // Debt CRUD
  addDebt(debt: Omit<Debt, "id" | "createdAt">): void;
  settleDebt(debtId: string): void;
  removeDebt(debtId: string): void;

  // Payments
  addPayment(debtId: string, amount: number, note?: string): void;

  // Person CRUD
  addPerson(name: string): string;
  removePerson(personId: string): void;
  getPerson(id: string): Person | undefined;

  // Computed
  getDebtsByDirection(dir: DebtDirection): Debt[];
  getPersonBalance(personId: string): number;
  getRemainingAmount(debtId: string): number;
  getDebtsForPerson(personId: string): Debt[];
  getPaymentsForDebt(debtId: string): Payment[];
}

export const useDebtStore = create<DebtStore>()(
  persist(
    (set, get) => ({
      debts: [],
      payments: [],
      people: [],

      addDebt(debtData) {
        const newDebt: Debt = {
          ...debtData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ debts: [...state.debts, newDebt] }));
      },

      settleDebt(debtId) {
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === debtId
              ? { ...d, settledAt: new Date().toISOString() }
              : d
          ),
        }));
      },

      removeDebt(debtId) {
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== debtId),
          payments: state.payments.filter((p) => p.debtId !== debtId),
        }));
      },

      addPayment(debtId, amount, note) {
        const remaining = get().getRemainingAmount(debtId);
        const isFullPayment = amount >= remaining;

        const newPayment: Payment = {
          id: generateId(),
          debtId,
          amount: Math.min(amount, remaining),
          note,
          createdAt: new Date().toISOString(),
          type: isFullPayment ? "full" : "partial",
        };

        set((state) => {
          const updatedPayments = [...state.payments, newPayment];
          const updatedDebts = isFullPayment
            ? state.debts.map((d) =>
                d.id === debtId
                  ? { ...d, settledAt: new Date().toISOString() }
                  : d
              )
            : state.debts;
          return { payments: updatedPayments, debts: updatedDebts };
        });
      },

      addPerson(name) {
        const id = generateId();
        const newPerson: Person = {
          id,
          name,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ people: [...state.people, newPerson] }));
        return id;
      },

      removePerson(personId) {
        set((state) => {
          const debtIds = state.debts
            .filter((d) => d.personId === personId)
            .map((d) => d.id);
          return {
            people: state.people.filter((p) => p.id !== personId),
            debts: state.debts.filter((d) => d.personId !== personId),
            payments: state.payments.filter(
              (p) => !debtIds.includes(p.debtId)
            ),
          };
        });
      },

      getPerson(id) {
        return get().people.find((p) => p.id === id);
      },

      getDebtsByDirection(dir) {
        return get().debts.filter((d) => d.direction === dir && !d.settledAt);
      },

      getPersonBalance(personId) {
        const { debts, payments } = get();
        const personDebts = debts.filter((d) => d.personId === personId);

        let balance = 0;
        for (const debt of personDebts) {
          if (debt.settledAt) continue;
          const paidAmount = payments
            .filter((p) => p.debtId === debt.id)
            .reduce((sum, p) => sum + p.amount, 0);
          const remaining = debt.amount - paidAmount;

          if (debt.direction === "owed_to_me") {
            balance += remaining;
          } else {
            balance -= remaining;
          }
        }
        return balance;
      },

      getRemainingAmount(debtId) {
        const debt = get().debts.find((d) => d.id === debtId);
        if (!debt) return 0;
        const paid = get()
          .payments.filter((p) => p.debtId === debtId)
          .reduce((sum, p) => sum + p.amount, 0);
        return Math.max(0, debt.amount - paid);
      },

      getDebtsForPerson(personId) {
        return get().debts.filter((d) => d.personId === personId);
      },

      getPaymentsForDebt(debtId) {
        return get().payments.filter((p) => p.debtId === debtId);
      },
    }),
    {
      name: "qaryz-debts",
    }
  )
);
