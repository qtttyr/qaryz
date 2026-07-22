/**
 * groupSettlementToDebt — перенос групповых балансов в личные долги (debtStore).
 *
 * Когда все расходы группы закрыты, для каждого участника создаются записи в debtStore
 * с его персональными долгами на основе упрощённых взаимозачётов (simplifyDebts).
 *
 * ## Архитектура
 * - Person создаётся локально (без сохранения в Supabase), с ID = auth userId участника
 * - Debt создаётся через debtStore.addDebt() (сохраняется в Supabase)
 * - Для дедупликации используется description: `@group/{groupId}:{groupName}`
 * - При повторном вызове проверяется наличие таких тегов в debts
 * - syncGroupSettlementsToDebts() также восстанавливает Person для существующих debts
 *   (например, на другом устройстве, где Person ещё не создан локально)
 *
 * ## Использование
 * 1. После закрытия счёта: createGroupSettlementDebts(groupId, groupName)
 * 2. После синхронизации:  syncGroupSettlementsToDebts()
 */
import { useAuthStore } from "@/stores/authStore";
import { useDebtStore } from "@/stores/debtStore";
import { useGroupStore } from "@/stores/groupStore";
import { supabase } from "@/lib/supabase";

const GROUP_TAG = "@group/";

// ─── simplifyDebts — упрощение долгов (greedy matching) ─────

/** Исходные данные: userId, balance, name */
export interface BalanceInfo {
  userId: string;
  balance: number;
  name: string;
}

/** Результат: кто кому сколько должен */
export interface DebtTransfer {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
}

/**
 * Жадный алгоритм упрощения долгов.
 * Creditors (balance > 0) ← Debtors (balance < 0).
 * Минимизирует количество транзакций между участниками группы.
 */
export function simplifyDebts(balances: BalanceInfo[]): DebtTransfer[] {
  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);

  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b, balance: -b.balance }))
    .sort((a, b) => b.balance - a.balance);

  const txns: DebtTransfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].balance, creditors[j].balance);
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0) {
      txns.push({
        from: debtors[i].userId,
        to: creditors[j].userId,
        amount: rounded,
        fromName: debtors[i].name,
        toName: creditors[j].name,
      });
    }

    debtors[i].balance -= amount;
    creditors[j].balance -= amount;

    if (Math.abs(debtors[i].balance) < 0.01) i++;
    if (Math.abs(creditors[j].balance) < 0.01) j++;
  }

  return txns;
}

// ─── Utils ──────────────────────────────────────────────────

function getGroupTag(groupId: string): string {
  return `${GROUP_TAG}${groupId}:`;
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Создать личные долги для текущего пользователя на основе
 * финального баланса группы после закрытия всех расходов.
 *
 * @param groupId — ID группы
 * @param groupName — название группы (для description)
 * @returns true, если долги были созданы
 */
export async function createGroupSettlementDebts(
  groupId: string,
  groupName: string
): Promise<boolean> {
  const user = useAuthStore.getState().user;
  if (!user) return false;

  const groupStore = useGroupStore.getState();
  const debtStore = useDebtStore.getState();

  // ── 1. Все расходы должны быть закрыты ──
  const activeExpenses = groupStore.getActiveExpenses(groupId);
  const allExpenses = groupStore.getExpenses(groupId);
  if (activeExpenses.length > 0 || allExpenses.length === 0) return false;

  // ── 2. Дедупликация — проверяем @group/{groupId}: ──
  const tag = getGroupTag(groupId);
  const alreadyProcessed = debtStore.debts.some((d) =>
    d.description?.startsWith(tag)
  );
  if (alreadyProcessed) return false;

  // ── 3. Получаем финальный баланс (включая закрытые расходы) ──
  const balances = groupStore.getGroupBalance(groupId, true);
  const members = groupStore.getMembers(groupId);
  const memberMap = new Map(members.map((m) => [m.userId, m]));

  // Текущий пользователь должен быть участником с ненулевым балансом
  const myBal = balances.find((b) => b.userId === user.id);
  if (!myBal || Math.abs(myBal.balance) < 0.01) return false;

  // ── 4. Получаем pairwise-транзакции через simplifyDebts ──
  const enriched: BalanceInfo[] = balances.map((b) => ({
    userId: b.userId,
    balance: b.balance,
    name: b.name,
  }));
  const allTxns = simplifyDebts(enriched);

  // Транзакции, где участвует текущий пользователь
  const myTxns = allTxns.filter(
    (t) => t.from === user.id || t.to === user.id
  );
  if (myTxns.length === 0) return false;

  // ── 5. Создаём Person + Debt для каждой транзакции ──
  let createdCount = 0;

  for (const t of myTxns) {
    // Другая сторона транзакции
    const otherUserId = t.from === user.id ? t.to : t.from;
    const otherMember = memberMap.get(otherUserId);
    const otherName =
      otherMember?.nickname || otherMember?.name || t.fromName || t.toName || "Пользователь";

    // 5a. Создать Person локально (если ещё нет), с ID = auth userId
    const personExists = debtStore.people.some((p) => p.id === otherUserId);
    if (!personExists) {
      // Добавляем локально + в Supabase (для кросс-устройств)
      const newPerson = {
        id: otherUserId,
        name: otherName,
        createdAt: new Date().toISOString(),
      };
      useDebtStore.setState((s) => ({
        people: [...s.people, newPerson],
      }));

      // Best-effort sync в Supabase (upsert, чтобы избежать PK clash — каждый
      // пользователь имеет свою строку с этим ID через RLS user_id = auth.uid())
      try {
        await supabase.from("persons").upsert(
          {
            id: otherUserId,
            user_id: user.id,
            name: otherName,
          },
          { onConflict: "id" }
        );
      } catch {
        // Если PK clash (другой пользователь уже занял этот ID), игнорируем —
        // Person остаётся локально и будет подхвачен merge-логикой syncFromSupabase
      }
    }

    // 5b. Направление долга с точки зрения текущего пользователя
    const isIOwe = t.from === user.id; // Я плачу → я должен
    const direction = isIOwe ? ("i_owe" as const) : ("owed_to_me" as const);

    // 5c. Создать Debt (сохраняется в Supabase)
    await debtStore.addDebt({
      personId: otherUserId,
      direction,
      amount: t.amount,
      description: `${tag}${groupName}`,
    });

    createdCount++;
  }

  return createdCount > 0;
}

/**
 * Проверить все группы текущего пользователя на предмет полностью
 * закрытых расходов и создать для них личные долги.
 *
 * Также восстанавливает Person для существующих group settlement debts
 * (необходимо для корректного отображения на других устройствах).
 *
 * Безопасно вызывать многократно — дедупликация по тегу @group/{id}.
 *
 * @returns количество обработанных групп
 */
export async function syncGroupSettlementsToDebts(): Promise<number> {
  const user = useAuthStore.getState().user;
  if (!user) return 0;

  const groupStore = useGroupStore.getState();
  const debtStore = useDebtStore.getState();

  // ── 1. Собираем группы текущего пользователя ──
  const userGroupIds = [
    ...new Set(
      groupStore.members
        .filter((m) => m.userId === user.id)
        .map((m) => m.groupId)
    ),
  ];

  let processed = 0;

  // ── 2. Создаём новые долги для закрытых групп ──
  for (const groupId of userGroupIds) {
    const group = groupStore.groups.find((g) => g.id === groupId);
    if (!group) continue;

    const ok = await createGroupSettlementDebts(groupId, group.name);
    if (ok) processed++;
  }

  // ── 3. Восстанавливаем Person для существующих group settlement debts ──
  //    (нужно для: другое устройство, очистка localStorage, и т.д.)
  const members = groupStore.members;
  const existingPersonIds = new Set(debtStore.people.map((p) => p.id));
  const personsToAdd: { id: string; name: string; createdAt: string }[] = [];

  for (const debt of debtStore.debts) {
    if (!debt.description?.startsWith(GROUP_TAG)) continue;
    if (existingPersonIds.has(debt.personId)) continue;

    // Ищем участника группы по userId
    const member = members.find((m) => m.userId === debt.personId);
    if (member) {
      const name = member.nickname || member.name || "Пользователь";
      personsToAdd.push({
        id: debt.personId,
        name,
        createdAt: new Date().toISOString(),
      });
      existingPersonIds.add(debt.personId);
    }
  }

  if (personsToAdd.length > 0) {
    useDebtStore.setState((s) => ({
      people: [...s.people, ...personsToAdd],
    }));

    // Best-effort sync в Supabase
    for (const p of personsToAdd) {
      try {
        await supabase.from("persons").upsert(
          {
            id: p.id,
            user_id: user.id,
            name: p.name,
          },
          { onConflict: "id" }
        );
      } catch {
        // Игнорируем PK clash — Person остаётся локально
      }
    }
  }

  return processed;
}

export { GROUP_TAG };
