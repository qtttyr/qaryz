import { useMemo } from "react";
import { useDebtStore } from "@/stores/debtStore";
import type { Debt, Payment } from "@/types/debt";

// ── Achievement Definition ─────────────────────────────

export interface Achievement {
  id: string;
  /** Emoji icon */
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  /** Higher rarity = more exclusive */
  rarity: "common" | "rare" | "epic" | "legendary";
}

// ── Friend Analytics ───────────────────────────────────

export interface FriendAnalytics {
  /** All debts involving this friend */
  debts: Debt[];
  /** Payments for those debts */
  payments: Payment[];
  /** Person entry in debtStore */
  personName: string;

  // ── Core balance ──
  totalGiven: number;       // сколько я ему дал (owed_to_me, без учёта платежей)
  totalReceived: number;    // сколько он мне дал (i_owe, без учёта платежей)
  balance: number;          // текущий чистый баланс

  // ── Debt counts ──
  activeDebts: number;
  closedDebts: number;
  totalDebts: number;

  // ── Amounts ──
  totalAllTime: number;            // сумма всех долгов за всё время
  totalClosedAmount: number;       // сумма закрытых долгов
  averageDebt: number;
  biggestDebt: { amount: number; description?: string } | null;
  smallestActiveDebt: { amount: number; description?: string } | null;

  // ── Payments ──
  totalPaid: number;           // сколько всего выплачено
  totalPaymentsCount: number;

  // ── Direction stats ──
  iOwCount: number;            // сколько раз я должен
  owedToMeCount: number;       // сколько раз должны мне

  // ── Time ──
  firstDebtDate: string | null;
  lastActivity: string;
  monthlyActivity: { month: string; created: number; settled: number }[];
  oldestActiveMonths: number;  // сколько месяцев висит самый старый долг

  // ── Gamification ──
  achievements: Achievement[];
  topAchievement: Achievement | null;
}

// ── Achievement conditions ──────────────────────────────

function calcAchievements(stats: {
  activeDebts: number;
  closedDebts: number;
  totalDebts: number;
  totalAllTime: number;
  balance: number;
  iOwCount: number;
  owedToMeCount: number;
  debts: Debt[];
  payments: Payment[];
  totalPaid: number;
  firstDebtDate: string | null;
  averageDebt: number;
  oldestActiveMonths: number;
  hasBothDirections: boolean;
}): Achievement[] {
  const {
    activeDebts, closedDebts, totalDebts,
    totalAllTime, balance,
    debts, firstDebtDate, averageDebt,
    oldestActiveMonths, hasBothDirections,
  } = stats;

  const achievements: Achievement[] = [];

  // 🧘 Дзен-мастер — нет активных долгов
  achievements.push({
    id: "zen-master",
    icon: "🧘",
    title: "Дзен-мастер",
    description: "Никаких активных долгов — полная гармония в расчётах",
    unlocked: activeDebts === 0 && totalDebts > 0,
    rarity: "epic",
  });

  // 🤝 Надёжный друг — закрыто 3+ долгов
  achievements.push({
    id: "reliable",
    icon: "🤝",
    title: "Надёжный друг",
    description: `${closedDebts} ${getPlural(closedDebts, ["долг закрыт", "долга закрыто", "долгов закрыто"])} — на него можно положиться`,
    unlocked: closedDebts >= 3,
    rarity: closedDebts >= 10 ? "epic" : closedDebts >= 5 ? "rare" : "common",
  });

  // 👑 Кредитный король — общая сумма > 100k
  achievements.push({
    id: "credit-king",
    icon: "👑",
    title: "Кредитный король",
    description: `Общая сумма долгов: ${formatNum(totalAllTime)} — серьёзный размах`,
    unlocked: totalAllTime >= 100000,
    rarity: totalAllTime >= 1000000 ? "legendary" : totalAllTime >= 500000 ? "epic" : "rare",
  });

  // ⚡ Спринтер — 5+ мелких долгов
  const smallDebts = debts.filter(d => d.amount < 5000).length;
  achievements.push({
    id: "sprinter",
    icon: "⚡",
    title: "Спринтер",
    description: `${smallDebts} ${getPlural(smallDebts, ["мелкий долг", "мелких долга", "мелких долгов"])} — быстро и без напряга`,
    unlocked: smallDebts >= 5,
    rarity: "common",
  });

  // 🔄 Качели — есть долги в обе стороны
  achievements.push({
    id: "swing",
    icon: "🔄",
    title: "Качели",
    description: "Долги в обе стороны — настоящие друзья никогда не считаются",
    unlocked: hasBothDirections,
    rarity: "rare",
  });

  // 🎯 Снайпер — все долги закрыты (100%)
  achievements.push({
    id: "sniper",
    icon: "🎯",
    title: "Снайпер",
    description: `${totalDebts} из ${totalDebts} долгов закрыты — идеальная точность`,
    unlocked: closedDebts === totalDebts && totalDebts > 0,
    rarity: "legendary",
  });

  // 📈 Инвестор — мне должны больше
  achievements.push({
    id: "investor",
    icon: "📈",
    title: "Инвестор",
    description: "Он должен больше, чем я ему — выгодное партнёрство",
    unlocked: balance > 0 && totalDebts > 0,
    rarity: "common",
  });

  // 💎 Платиновый клиент — общая сумма > 500k
  achievements.push({
    id: "platinum",
    icon: "💎",
    title: "Платиновый клиент",
    description: `Совокупный оборот: ${formatNum(totalAllTime)} — элитный уровень`,
    unlocked: totalAllTime >= 500000,
    rarity: "legendary",
  });

  // 🏆 Чемпион — закрыто 10+ долгов
  achievements.push({
    id: "champion",
    icon: "🏆",
    title: "Чемпион",
    description: `${closedDebts} ${getPlural(closedDebts, ["долг закрыт", "долга закрыто", "долгов закрыто"])} — рекордсмен по выплатам`,
    unlocked: closedDebts >= 10,
    rarity: "epic",
  });

  // 💔 Сердцеед — я должен больше
  achievements.push({
    id: "heartbreaker",
    icon: "💔",
    title: "Сердцеед",
    description: "Я должен больше, чем он — беру, но не отдаю...",
    unlocked: balance < 0 && totalDebts > 0,
    rarity: "common",
  });

  // 🎖️ Ветеран — первый долг > 1 года назад
  let isVeteran = false;
  if (firstDebtDate) {
    const years = (Date.now() - new Date(firstDebtDate).getTime()) / (365 * 24 * 60 * 60 * 1000);
    isVeteran = years >= 1;
  }
  achievements.push({
    id: "veteran",
    icon: "🎖️",
    title: "Ветеран",
    description: "Знакомы больше года — старые долги не ржавеют",
    unlocked: isVeteran,
    rarity: "epic",
  });

  // 💸 Транжира — средний долг > 50k
  achievements.push({
    id: "spender",
    icon: "💸",
    title: "Транжира",
    description: `Средний долг ${formatNum(averageDebt)} — размах чувствуется`,
    unlocked: averageDebt >= 50000 && totalDebts > 0,
    rarity: "rare",
  });

  // 🐷 Копилка — каждый долг < 5000
  const allUnder5k = debts.length > 0 && debts.every(d => d.amount < 5000);
  achievements.push({
    id: "piggy-bank",
    icon: "🐷",
    title: "Копилка",
    description: "Все долги до 5000₸ — мелочь, а приятно",
    unlocked: allUnder5k && debts.length >= 2,
    rarity: "rare",
  });

  // 🌱 Новичок — первый долг < 30 дней
  let isNewbie = false;
  if (firstDebtDate) {
    const days = (Date.now() - new Date(firstDebtDate).getTime()) / (24 * 60 * 60 * 1000);
    isNewbie = days <= 30;
  }
  achievements.push({
    id: "newbie",
    icon: "🌱",
    title: "Новичок",
    description: "Первые шаги в мире взаиморасчётов — всё только начинается",
    unlocked: isNewbie,
    rarity: "common",
  });

  // 🐢 Черепаха — есть долг старше 6 месяцев
  achievements.push({
    id: "turtle",
    icon: "🐢",
    title: "Черепаха",
    description: `Самый старый долг висит ${oldestActiveMonths} ${getPlural(oldestActiveMonths, ["месяц", "месяца", "месяцев"])} — терпение, друг`,
    unlocked: oldestActiveMonths >= 6,
    rarity: "rare",
  });

  // 🤷 Баланс — всё сходится
  achievements.push({
    id: "balanced",
    icon: "🤷",
    title: "Ноль эмоций",
    description: "Полный баланс — никто никому не должен. Идеально",
    unlocked: balance === 0 && totalDebts > 0,
    rarity: "rare",
  });

  // Zero debt — совсем нет долгов
  achievements.push({
    id: "zero",
    icon: "✨",
    title: "Чистый лист",
    description: "Ни одного долга — кристально чистые отношения",
    unlocked: totalDebts === 0,
    rarity: "epic",
  });

  return achievements.sort((a, b) => {
    // Sort: unlocked first, then by rarity
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99);
  });
}

// ── Helpers ─────────────────────────────────────────────

function getPlural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n);
  const lastDigit = abs % 10;
  const lastTwo = abs % 100;
  if (lastTwo >= 11 && lastTwo <= 19) return forms[2];
  if (lastDigit === 1) return forms[0];
  if (lastDigit >= 2 && lastDigit <= 4) return forms[1];
  return forms[2];
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)} млн₸`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)} тыс₸`;
  return `${n.toLocaleString()} ₸`;
}

// ── Hook ────────────────────────────────────────────────

export function useFriendAnalytics(friendUserId: string | undefined): FriendAnalytics {
  const debts = useDebtStore((s) => s.debts);
  const payments = useDebtStore((s) => s.payments);
  const people = useDebtStore((s) => s.people);

  return useMemo(() => {
    const empty: FriendAnalytics = {
      debts: [], payments: [],
      personName: "Пользователь",
      totalGiven: 0, totalReceived: 0, balance: 0,
      activeDebts: 0, closedDebts: 0, totalDebts: 0,
      totalAllTime: 0, totalClosedAmount: 0,
      averageDebt: 0,
      biggestDebt: null, smallestActiveDebt: null,
      totalPaid: 0, totalPaymentsCount: 0,
      iOwCount: 0, owedToMeCount: 0,
      firstDebtDate: null, lastActivity: "",
      monthlyActivity: [],
      oldestActiveMonths: 0,
      achievements: [],
      topAchievement: null,
    };

    if (!friendUserId) return empty;

    // Filter debts for this friend
    const friendDebts = debts.filter((d) => d.personId === friendUserId);
    const debtIds = new Set(friendDebts.map((d) => d.id));
    const friendPayments = payments.filter((p) => debtIds.has(p.debtId));

    const person = people.find((p) => p.id === friendUserId);
    const personName = person?.name || "Пользователь";

    const totalDebts = friendDebts.length;
    if (totalDebts === 0) {
      const achievements = calcAchievements({
        activeDebts: 0, closedDebts: 0, totalDebts: 0,
        totalAllTime: 0, balance: 0,
        iOwCount: 0, owedToMeCount: 0, debts: [], payments: [],
        totalPaid: 0, firstDebtDate: null, averageDebt: 0,
        oldestActiveMonths: 0, totalClosedAmount: 0,
        hasBothDirections: false, biggestDebt: null,
      });

      return {
        ...empty,
        personName,
        achievements,
        topAchievement: achievements.find((a) => a.unlocked) || null,
      };
    }

    // ── Core stats ──
    const activeDebtsList = friendDebts.filter((d) => !d.settledAt);
    const closedDebtsList = friendDebts.filter((d) => d.settledAt);
    const activeDebts = activeDebtsList.length;
    const closedDebts = closedDebtsList.length;

    // Amounts
    const totalAllTime = friendDebts.reduce((s, d) => s + d.amount, 0);
    const totalClosedAmount = closedDebtsList.reduce((s, d) => s + d.amount, 0);
    const averageDebt = totalAllTime / totalDebts;

    // Biggest debt (all time)
    let biggestDebt: { amount: number; description?: string } | null = null;
    if (friendDebts.length > 0) {
      const biggest = friendDebts.reduce((max, d) => (d.amount > max.amount ? d : max));
      biggestDebt = { amount: biggest.amount, description: biggest.description };
    }

    // Smallest active debt
    let smallestActiveDebt: { amount: number; description?: string } | null = null;
    if (activeDebtsList.length > 0) {
      const smallest = activeDebtsList.reduce((min, d) => (d.amount < min.amount ? d : min));
      smallestActiveDebt = { amount: smallest.amount, description: smallest.description };
    }

    // Direction counts
    const iOwCount = friendDebts.filter((d) => d.direction === "i_owe").length;
    const owedToMeCount = friendDebts.filter((d) => d.direction === "owed_to_me").length;

    // Balance (current remaining)
    let balance = 0;
    let totalGiven = 0;
    let totalReceived = 0;
    for (const debt of friendDebts) {
      if (debt.direction === "owed_to_me") {
        totalGiven += debt.amount;
      } else {
        totalReceived += debt.amount;
      }
      if (debt.settledAt) continue;
      const paid = friendPayments
        .filter((p) => p.debtId === debt.id)
        .reduce((sum, p) => sum + p.amount, 0);
      const remaining = debt.amount - paid;
      balance += debt.direction === "owed_to_me" ? remaining : -remaining;
    }

    // Payments total
    const totalPaid = friendPayments.reduce((s, p) => s + p.amount, 0);
    const totalPaymentsCount = friendPayments.length;

    // Dates
    const allDates = [
      ...friendDebts.map((d) => d.createdAt),
      ...friendPayments.map((p) => p.createdAt),
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const lastActivity = allDates[0] || "";
    const firstDebtDate = friendDebts.length > 0
      ? friendDebts.reduce((earliest, d) =>
          d.createdAt < earliest.createdAt ? d : earliest
        ).createdAt
      : null;

    // Oldest active debt in months
    let oldestActiveMonths = 0;
    if (activeDebtsList.length > 0) {
      const oldest = activeDebtsList.reduce((earliest, d) =>
        d.createdAt < earliest.createdAt ? d : earliest
      );
      oldestActiveMonths = Math.floor(
        (Date.now() - new Date(oldest.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)
      );
    }

    // Has both directions?
    const hasBothDirections = iOwCount > 0 && owedToMeCount > 0;

    // ── Monthly activity (last 6 months) ──
    const monthlyActivity: { month: string; created: number; settled: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString("ru-RU", { month: "short" });
      const year = d.getFullYear();
      const month = d.getMonth();

      const created = friendDebts.filter((debt) => {
        const dd = new Date(debt.createdAt);
        return dd.getFullYear() === year && dd.getMonth() === month;
      }).length;

      const settled = friendDebts.filter((debt) => {
        if (!debt.settledAt) return false;
        const dd = new Date(debt.settledAt);
        return dd.getFullYear() === year && dd.getMonth() === month;
      }).length;

      monthlyActivity.push({ month: monthStr, created, settled });
    }

    // ── Achievements ──
    const achievements = calcAchievements({
      activeDebts, closedDebts, totalDebts,
      totalAllTime, balance,
      debts: friendDebts,
      firstDebtDate, averageDebt,
      oldestActiveMonths, hasBothDirections,
    });

    const topAchievement = achievements.find((a) => a.unlocked) || null;

    return {
      debts: friendDebts,
      payments: friendPayments,
      personName,
      totalGiven,
      totalReceived,
      balance,
      activeDebts,
      closedDebts,
      totalDebts,
      totalAllTime,
      totalClosedAmount,
      averageDebt,
      biggestDebt,
      smallestActiveDebt,
      totalPaid,
      totalPaymentsCount,
      iOwCount,
      owedToMeCount,
      firstDebtDate,
      lastActivity,
      monthlyActivity,
      oldestActiveMonths,
      achievements,
      topAchievement,
    };
  }, [friendUserId, debts, payments, people]);
}
