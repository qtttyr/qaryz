import { create } from "zustand";
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

export const useDebtStore = create<DebtStore>()((set, get) => ({
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
      const { error } = await supabase.from("persons").insert({
        id,
        user_id: user.id,
        name,
        phone: phone || null,
      } as never);
      if (error) console.error("addPerson error:", error);
    }

    return id;
  },

  updatePerson: async (id, partial) => {
    set((state) => ({
      people: state.people.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    }));

    const user = useAuthStore.getState().user;
    if (user) {
      const { error } = await supabase.from("persons").update(partial as never).eq("id", id).eq("user_id", user.id);
      if (error) console.error("updatePerson error:", error);
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
      const { error } = await supabase.from("debts").insert({
        id: newDebt.id,
        user_id: user.id,
        person_id: newDebt.personId,
        direction: newDebt.direction,
        amount: newDebt.amount,
        description: newDebt.description || null,
      } as never);
      if (error) console.error("addDebt error:", error);
    }
  },

  settleDebt: async (debtId) => {
    const settledAt = new Date().toISOString();
    set((state) => ({
      debts: state.debts.map((d) => (d.id === debtId ? { ...d, settledAt } : d)),
    }));

    const user = useAuthStore.getState().user;
    if (user) {
      const { error } = await supabase.from("debts").update({ settled_at: settledAt } as never).eq("id", debtId).eq("user_id", user.id);
      if (error) console.error("settleDebt error:", error);
    }
  },

  removeDebt: async (debtId) => {
    const debt = get().debts.find((d) => d.id === debtId);

    set((state) => ({
      debts: state.debts.filter((d) => d.id !== debtId),
      payments: state.payments.filter((p) => p.debtId !== debtId),
    }));

    const user = useAuthStore.getState().user;
    if (!user) return;

    // If this is a shared debt, mark the shared_debts row as settled so it never reappears
    if (debt?.sharedDebtRefId) {
      const { error } = await supabase
        .from("shared_debts")
        .update({ settled_at: new Date().toISOString() })
        .eq("id", debt.sharedDebtRefId);
      if (error) console.error("removeSharedDebt: failed to mark settled", error);
      return;
    }

    // Regular debt — delete from Supabase debts table
    await supabase.from("payments").delete().eq("debt_id", debtId).eq("user_id", user.id);
    await supabase.from("debts").delete().eq("id", debtId).eq("user_id", user.id);
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
    const fromUserId = direction === "owed_to_me" ? friendUserId : user.id;
    const toUserId = direction === "owed_to_me" ? user.id : friendUserId;

    // Insert into Supabase shared_debts table
    const { error: insertErr } = await supabase.from("shared_debts").insert({
      id,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount,
      description: description || null,
      created_by: user.id,
    });
    if (insertErr) {
      console.error("Failed to create shared debt:", insertErr);
      throw new Error(insertErr.message);
    }

    // Create a local Person entry for this friend (if not exists)
    const existing = get().people.find((p) => p.id === friendUserId);
    let personId: string;
    if (existing) {
      personId = existing.id;
    } else {
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

    // Create local debt entry using shared_debts.id as debt ID (deterministic)
    const newDebt: Debt = {
      id, // use shared_debts.id — same ID for both sides
      personId,
      direction,
      amount,
      description: description || undefined,
      createdAt: new Date().toISOString(),
      sharedDebtRefId: id,
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
      otherName: undefined,
      otherUsername: undefined,
      otherAvatar: undefined,
    };
    set((s) => ({ sharedDebts: [...s.sharedDebts, newShared] }));
  },

  settleSharedDebt: async (debtId) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const settledAt = new Date().toISOString();
    set((s) => ({
      sharedDebts: s.sharedDebts.map((d) =>
        d.id === debtId ? { ...d, settledAt } : d
      ),
      debts: s.debts.map((d) =>
        d.sharedDebtRefId === debtId ? { ...d, settledAt } : d
      ),
    }));

    await supabase
      .from("shared_debts")
      .update({ settled_at: settledAt })
      .eq("id", debtId);
  },

  syncSharedDebts: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      // Step 1: fetch raw shared_debts without FK joins
      const { data: raw, error: sdErr } = await supabase
        .from("shared_debts")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (sdErr) {
        console.error("Failed to fetch shared debts:", sdErr);
        return;
      }

      const rows = (raw || []) as Record<string, unknown>[];
      if (rows.length === 0) return;

      // Step 2: collect all user IDs we need profiles for
      const userIds = new Set<string>();
      for (const r of rows) {
        if (r.from_user_id) userIds.add(r.from_user_id as string);
        if (r.to_user_id) userIds.add(r.to_user_id as string);
      }

      // Step 3: batch-fetch profiles
      const { data: profilesRaw, error: pfErr } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url, phone")
        .in("id", Array.from(userIds));

      if (pfErr) {
        console.error("Failed to fetch profiles for shared debts:", pfErr);
        return;
      }

      const profileMap: Record<string, Record<string, unknown>> = {};
      for (const p of (profilesRaw || []) as Record<string, unknown>[]) {
        profileMap[p.id as string] = p;
      }

      // Step 4: build state — deterministic IDs from shared_debts.id
      const sharedList: SharedDebt[] = [];
      const peopleSet = new Set(get().people.map((p) => p.id));
      const existingIds = new Set(get().debts.map((d) => d.id));
      const newPeople: Person[] = [];
      const newDebts: Debt[] = [];

      for (const d of rows) {
        // Skip rows with settled_at (deleted or fully paid)
        if (d.settled_at) continue;

        const isFromMe = d.from_user_id === user.id;
        const otherUserId = isFromMe
          ? (d.to_user_id as string)
          : (d.from_user_id as string);
        const otherProfile = profileMap[otherUserId] || {};

        sharedList.push({
          id: d.id as string,
          fromUserId: d.from_user_id as string,
          toUserId: d.to_user_id as string,
          amount: Number(d.amount),
          description: (d.description as string) || undefined,
          createdBy: d.created_by as string,
          createdAt: d.created_at as string,
          otherName: otherProfile.name as string,
          otherUsername: otherProfile.username as string,
          otherAvatar: (otherProfile.avatar_url as string) || undefined,
        });

        // Ensure Person entry
        if (!peopleSet.has(otherUserId)) {
          peopleSet.add(otherUserId);
          newPeople.push({
            id: otherUserId,
            name: (otherProfile.name as string) || "Пользователь",
            phone: (otherProfile.phone as string) || undefined,
            createdAt: d.created_at as string,
          });
        }

        // Compute direction from current user's perspective
        const debtDir: DebtDirection =
          d.from_user_id === user.id ? "i_owe" : "owed_to_me";

        // Use shared_debts.id as the Debt.id — deterministic, no duplicates
        const sdId = d.id as string;
        if (!existingIds.has(sdId)) {
          existingIds.add(sdId);
          newDebts.push({
            id: sdId,
            personId: otherUserId,
            direction: debtDir,
            amount: Number(d.amount),
            description: (d.description as string) || undefined,
            createdAt: d.created_at as string,
            sharedDebtRefId: sdId,
          });
        }
      }

      set((s) => ({
        sharedDebts: sharedList,
        people: [
          ...s.people,
          ...newPeople.filter((np) => !s.people.some((p) => p.id === np.id)),
        ],
        // Replace existing debts — remove old shared debt entries, add new ones
        debts: [
          ...s.debts.filter((d) => !d.sharedDebtRefId),
          ...newDebts,
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
      // Sync shared debts first — adds Person and Debt entries from shared_debts table
      await get().syncSharedDebts();

      // Fetch server data: this is THE source of truth for these tables
      const [personsRes, debtsRes, paymentsRes] = await Promise.all([
        supabase.from("persons").select("*").eq("user_id", user.id),
        supabase.from("debts").select("*").eq("user_id", user.id),
        supabase.from("payments").select("*").eq("user_id", user.id),
      ]);

      if (personsRes.error) console.error("syncFromSupabase persons error:", personsRes.error);
      if (debtsRes.error) console.error("syncFromSupabase debts error:", debtsRes.error);
      if (paymentsRes.error) console.error("syncFromSupabase payments error:", paymentsRes.error);

      // Map server data
      const serverPeople: Person[] = (personsRes.data || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        avatar: (p.avatar_url as string) || undefined,
        phone: (p.phone as string) || undefined,
        createdAt: p.created_at as string,
      }));

      const serverDebtIds = new Set((debtsRes.data || []).map((d: Record<string, unknown>) => d.id as string));

      // After syncSharedDebts, the store has shared debt entries.
      // Keep ALL server debts + shared debt entries (they have sharedDebtRefId, not in server)
      const currentState = get();
      const serverPersonIds = new Set(serverPeople.map((p) => p.id));

      set({
        people: [
          ...serverPeople,
          ...currentState.people.filter((p) => !serverPersonIds.has(p.id)),
        ],
        debts: [
          ...(debtsRes.data || []).map((d: Record<string, unknown>) => ({
            id: d.id as string,
            personId: d.person_id as string,
            direction: d.direction as DebtDirection,
            amount: Number(d.amount),
            description: (d.description as string) || undefined,
            createdAt: d.created_at as string,
            settledAt: (d.settled_at as string) || undefined,
          })),
          ...currentState.debts.filter((d) => d.sharedDebtRefId && !serverDebtIds.has(d.id)),
        ] as Debt[],
        payments: (paymentsRes.data || []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          debtId: p.debt_id as string,
          amount: Number(p.amount),
          note: (p.note as string) || undefined,
          createdAt: p.created_at as string,
          type: p.type as "partial" | "full",
        })) as Payment[],
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
}));