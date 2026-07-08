import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "./authStore";
import type { Debt, DebtDirection, Payment, Person } from "@/types/debt";
import type { SharedDebt } from "@/types/friend";

function generateId(): string {
  return crypto.randomUUID();
}

interface DebtStore {
  debts: Debt[];
  payments: Payment[];
  people: Person[];
  sharedDebts: SharedDebt[];
  syncStatus: "idle" | "syncing" | "synced" | "error";

  addDebt(debt: Omit<Debt, "id" | "createdAt">): Promise<void>;
  settleDebt(debtId: string): Promise<void>;
  removeDebt(debtId: string): Promise<void>;

  addPayment(debtId: string, amount: number, note?: string): Promise<void>;

  addPerson(name: string, phone?: string): Promise<string>;
  updatePerson(id: string, partial: Partial<Person>): Promise<void>;
  removePerson(personId: string): Promise<void>;
  getPerson(id: string): Person | undefined;

  // Shared debts (friend-to-friend)
  addSharedDebt(friendUserId: string, amount: number, direction: DebtDirection, description?: string): Promise<void>;
  settleSharedDebt(debtId: string): Promise<void>;
  syncSharedDebts: () => Promise<void>;

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
      sharedDebts: [],
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

      // ── Shared Debts ────────────────────────────────────

      addSharedDebt: async (friendUserId, amount, direction, description) => {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error("Not authenticated");

        const id = generateId();

        // Determine who is debtor (from) and who is creditor (to)
        // owed_to_me: friend owes me → from = friend, to = me
        // i_owe: I owe friend → from = me, to = friend
        const fromUserId = direction === "owed_to_me" ? friendUserId : user.id;
        const toUserId = direction === "owed_to_me" ? user.id : friendUserId;

        // Insert into Supabase shared_debts table
        try {
          await supabase.from("shared_debts").insert({
            id,
            from_user_id: fromUserId,
            to_user_id: toUserId,
            amount,
            description: description || null,
            created_by: user.id,
          });
        } catch (e) {
          console.error("Failed to create shared debt:", e);
          throw new Error("Не удалось создать долг");
        }

        // Also create a local Person entry for this friend
        const existing = get().people.find((p) => p.id === friendUserId);
        let personId: string;
        if (existing) {
          personId = existing.id;
        } else {
          // Find friend's name from friendStore
          const { useFriendStore } = await import("./friendStore");
          const friend = useFriendStore.getState().getFriend(friendUserId);
          const newPerson: Person = {
            id: friendUserId,
            name: friend?.name || "Пользователь",
            phone: friend?.phone,
            createdAt: new Date().toISOString(),
          };
          set((s) => ({ people: [...s.people, newPerson] }));
          personId = newPerson.id;
        }

        // Create a local debt entry with the correct direction, linked to shared debt
        const debtId = generateId();
        const newDebt: Debt = {
          id: debtId,
          personId,
          direction,
          amount,
          description: description || undefined,
          createdAt: new Date().toISOString(),
          sharedDebtRefId: id, // link to shared_debts.id
        };
        set((s) => ({ debts: [...s.debts, newDebt] }));

        // Add shared debt to local state
        const newShared: SharedDebt = {
          id,
          fromUserId,
          toUserId,
          amount,
          description: description || undefined,
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          otherName: undefined, // will be resolved on sync
          otherUsername: undefined,
          otherAvatar: undefined,
        };
        set((s) => ({ sharedDebts: [...s.sharedDebts, newShared] }));
      },

      settleSharedDebt: async (debtId) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set((s) => ({
          sharedDebts: s.sharedDebts.map((d) =>
            d.id === debtId ? { ...d, settledAt: new Date().toISOString() } : d
          ),
        }));

        try {
          await supabase
            .from("shared_debts")
            .update({ settled_at: new Date().toISOString() })
            .eq("id", debtId);
        } catch (e) {
          console.error("Failed to settle shared debt:", e);
        }
      },

      syncSharedDebts: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
          // Step 1: fetch raw shared_debts without FK joins
          const { data: raw } = await supabase
            .from("shared_debts")
            .select("*")
            .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
            .order("created_at", { ascending: false });

          const rows = (raw || []) as Record<string, unknown>[];
          if (rows.length === 0) return;

          // Step 2: collect all user IDs we need profiles for
          const userIds = new Set<string>();
          for (const r of rows) {
            if (r.from_user_id) userIds.add(r.from_user_id as string);
            if (r.to_user_id) userIds.add(r.to_user_id as string);
          }

          // Step 3: batch-fetch profiles
          const { data: profilesRaw } = await supabase
            .from("profiles")
            .select("id, name, username, avatar_url, phone")
            .in("id", Array.from(userIds));

          const profileMap: Record<string, Record<string, unknown>> = {};
          for (const p of (profilesRaw || []) as Record<string, unknown>[]) {
            profileMap[p.id as string] = p;
          }

          // Step 4: build local state
          const sharedList: SharedDebt[] = [];
          const newPeople: Person[] = [];
          const newDebts: Debt[] = [];

          const currentPeople = get().people;
          const currentDebts = get().debts;

          for (const d of rows) {
            const currentUserId = user.id;
            const isFromMe = d.from_user_id === currentUserId;
            const otherUserId = isFromMe
              ? (d.to_user_id as string)
              : (d.from_user_id as string);
            const otherProfile = profileMap[otherUserId] || {};

            const sharedDebt: SharedDebt = {
              id: d.id as string,
              fromUserId: d.from_user_id as string,
              toUserId: d.to_user_id as string,
              amount: Number(d.amount),
              description: (d.description as string) || undefined,
              createdBy: d.created_by as string,
              createdAt: d.created_at as string,
              settledAt: (d.settled_at as string) || undefined,
              otherName: otherProfile.name as string,
              otherUsername: otherProfile.username as string,
              otherAvatar: (otherProfile.avatar_url as string) || undefined,
            };
            sharedList.push(sharedDebt);

            // Ensure Person entry exists for the other user
            if (!currentPeople.some((p) => p.id === otherUserId)) {
              newPeople.push({
                id: otherUserId,
                name: (otherProfile.name as string) || "Пользователь",
                phone: (otherProfile.phone as string) || undefined,
                createdAt: d.created_at as string,
              });
            }

            // Compute direction from current user's perspective
            const debtDir: DebtDirection =
              d.from_user_id === currentUserId ? "i_owe" : "owed_to_me";

            // Create local debt entry if one doesn't already exist
            const existsAsLocalDebt = currentDebts.some(
              (debt) => debt.sharedDebtRefId === d.id || debt.id === d.id
            );
            if (!existsAsLocalDebt) {
              newDebts.push({
                id: generateId(),
                personId: otherUserId,
                direction: debtDir,
                amount: Number(d.amount),
                description: (d.description as string) || undefined,
                createdAt: d.created_at as string,
                settledAt: (d.settled_at as string) || undefined,
                sharedDebtRefId: d.id as string,
              });
            }
          }

          set((s) => ({
            sharedDebts: sharedList,
            people: [
              ...s.people,
              ...newPeople.filter((np) => !s.people.some((p) => p.id === np.id)),
            ],
            debts: [
              ...s.debts,
              ...newDebts.filter((nd) => !s.debts.some((d) => d.id === nd.id)),
            ],
          }));
        } catch (e) {
          console.error("Failed to sync shared debts:", e);
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
            get().syncSharedDebts(), // await shared debts too
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
            // Keep local debts (including shared debt entries added by syncSharedDebts)
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
        sharedDebts: state.sharedDebts,
      }),
    }
  )
);
