import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "./authStore";
import type { Debt, DebtDirection, Payment, Person } from "@/types/debt";

function generateId(): string {
  return crypto.randomUUID();
}

interface DebtStore {
  debts: Debt[];
  payments: Payment[];
  people: Person[];
  syncStatus: "idle" | "syncing" | "synced" | "error";

  addDebt(debt: Omit<Debt, "id" | "createdAt">): Promise<void>;
  settleDebt(debtId: string): Promise<void>;
  removeDebt(debtId: string): Promise<void>;

  addPayment(debtId: string, amount: number, note?: string): Promise<void>;

  addPerson(name: string, phone?: string): Promise<string>;
  updatePerson(id: string, partial: Partial<Person>): Promise<void>;
  removePerson(personId: string): Promise<void>;
  getPerson(id: string): Person | undefined;

  syncFromSupabase: () => Promise<void>;
  setData: (data: { debts: Debt[]; payments: Payment[]; people: Person[] }) => void;

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
      syncStatus: "idle",

      // ── Person CRUD ─────────────────────────────────────

      addPerson: async (name, phone) => {
        const id = generateId();
        const newPerson: Person = { id, name, phone, createdAt: new Date().toISOString() };
        set((state) => ({ people: [...state.people, newPerson] }));

        const user = useAuthStore.getState().user;
        if (user) {
          await supabase.from("persons").insert({
            id,
            user_id: user.id,
            name,
            phone: phone || null,
          } as never);
        }

        return id;
      },

      updatePerson: async (id, partial) => {
        set((state) => ({
          people: state.people.map((p) => (p.id === id ? { ...p, ...partial } : p)),
        }));

        const user = useAuthStore.getState().user;
        if (user) {
          await supabase.from("persons").update(partial as never).eq("id", id).eq("user_id", user.id);
        }
      },

      removePerson: async (personId) => {
        const state = get();
        const debtIds = state.debts.filter((d) => d.personId === personId).map((d) => d.id);

        set((s) => ({
          people: s.people.filter((p) => p.id !== personId),
          debts: s.debts.filter((d) => d.personId !== personId),
          payments: s.payments.filter((p) => !debtIds.includes(p.debtId)),
        }));

        const user = useAuthStore.getState().user;
        if (user) {
          if (debtIds.length > 0) {
            await supabase.from("payments").delete().in("debt_id", debtIds).eq("user_id", user.id);
            await supabase.from("debts").delete().eq("person_id", personId).eq("user_id", user.id);
          }
          await supabase.from("persons").delete().eq("id", personId).eq("user_id", user.id);
        }
      },

      getPerson(id) {
        return get().people.find((p) => p.id === id);
      },

      // ── Debt CRUD ───────────────────────────────────────

      addDebt: async (debtData) => {
        const newDebt: Debt = {
          ...debtData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ debts: [...state.debts, newDebt] }));

        const user = useAuthStore.getState().user;
        if (user) {
          await supabase.from("debts").insert({
            id: newDebt.id,
            user_id: user.id,
            person_id: newDebt.personId,
            direction: newDebt.direction,
            amount: newDebt.amount,
            description: newDebt.description || null,
          } as never);
        }
      },

      settleDebt: async (debtId) => {
        const settledAt = new Date().toISOString();
        set((state) => ({
          debts: state.debts.map((d) => (d.id === debtId ? { ...d, settledAt } : d)),
        }));

        const user = useAuthStore.getState().user;
        if (user) {
          await supabase.from("debts").update({ settled_at: settledAt } as never).eq("id", debtId).eq("user_id", user.id);
        }
      },

      removeDebt: async (debtId) => {
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== debtId),
          payments: state.payments.filter((p) => p.debtId !== debtId),
        }));

        const user = useAuthStore.getState().user;
        if (user) {
          await supabase.from("payments").delete().eq("debt_id", debtId).eq("user_id", user.id);
          await supabase.from("debts").delete().eq("id", debtId).eq("user_id", user.id);
        }
      },

      // ── Payments ────────────────────────────────────────

      addPayment: async (debtId, amount, note) => {
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
                d.id === debtId ? { ...d, settledAt: new Date().toISOString() } : d
              )
            : state.debts;
          return { payments: updatedPayments, debts: updatedDebts };
        });

        const user = useAuthStore.getState().user;
        if (user) {
          await supabase.from("payments").insert({
            id: newPayment.id,
            user_id: user.id,
            debt_id: debtId,
            amount: newPayment.amount,
            note: note || null,
            type: newPayment.type,
          } as never);

          if (isFullPayment) {
            await supabase
              .from("debts")
              .update({ settled_at: new Date().toISOString() } as never)
              .eq("id", debtId)
              .eq("user_id", user.id);
          }
        }
      },

      // ── Sync ────────────────────────────────────────────

      syncFromSupabase: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ syncStatus: "syncing" });

        try {
          const [personsRes, debtsRes, paymentsRes] = await Promise.all([
            supabase.from("persons").select("*").eq("user_id", user.id),
            supabase.from("debts").select("*").eq("user_id", user.id),
            supabase.from("payments").select("*").eq("user_id", user.id),
          ]);

          const localState = get();

          const serverPersonIds = new Set((personsRes.data || []).map((p: Record<string, unknown>) => p.id as string));
          const mergedPeople = [
            ...(personsRes.data || []).map((p: Record<string, unknown>) => ({
              id: p.id as string,
              name: p.name as string,
              avatar: (p.avatar_url as string) || undefined,
              phone: (p.phone as string) || undefined,
              createdAt: p.created_at as string,
            })),
            ...localState.people.filter((p) => !serverPersonIds.has(p.id)),
          ];

          const serverDebtIds = new Set((debtsRes.data || []).map((d: Record<string, unknown>) => d.id as string));
          const mergedDebts = [
            ...(debtsRes.data || []).map((d: Record<string, unknown>) => ({
              id: d.id as string,
              personId: d.person_id as string,
              direction: d.direction as DebtDirection,
              amount: Number(d.amount),
              description: (d.description as string) || undefined,
              createdAt: d.created_at as string,
              settledAt: (d.settled_at as string) || undefined,
            })),
            ...localState.debts.filter((d) => !serverDebtIds.has(d.id)),
          ];

          const serverPaymentIds = new Set((paymentsRes.data || []).map((p: Record<string, unknown>) => p.id as string));
          const mergedPayments = [
            ...(paymentsRes.data || []).map((p: Record<string, unknown>) => ({
              id: p.id as string,
              debtId: p.debt_id as string,
              amount: Number(p.amount),
              note: (p.note as string) || undefined,
              createdAt: p.created_at as string,
              type: p.type as "partial" | "full",
            })),
            ...localState.payments.filter((p) => !serverPaymentIds.has(p.id)),
          ];

          set({
            people: mergedPeople,
            debts: mergedDebts,
            payments: mergedPayments,
            syncStatus: "synced",
          });
        } catch {
          set({ syncStatus: "error" });
        }
      },

      setData: (data) => {
        set({ debts: data.debts, payments: data.payments, people: data.people, syncStatus: "synced" });
      },

      // ── Computed ────────────────────────────────────────

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
          balance += debt.direction === "owed_to_me" ? remaining : -remaining;
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
      partialize: (state) => ({
        debts: state.debts,
        payments: state.payments,
        people: state.people,
      }),
    }
  )
);
