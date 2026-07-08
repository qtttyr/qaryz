export interface Group {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  createdBy: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  nickname?: string;
  joinedAt: string;
  // Joined from profiles
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface Expense {
  id: string;
  groupId: string;
  paidBy: string;
  amount: number;
  description: string;
  category: string;
  splitMode: "equal" | "custom";
  createdAt: string;
  updatedAt: string;
  // Joined
  paidByName?: string;
}

export interface ExpenseShare {
  id: string;
  expenseId: string;
  userId: string;
  shareAmount: number;
  settled: boolean;
  // Joined
  userName?: string;
}

export type ExpenseCategory =
  | "food"
  | "transport"
  | "housing"
  | "entertainment"
  | "shopping"
  | "gift"
  | "health"
  | "education"
  | "other";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: "food", label: "Еда", emoji: "🍔" },
  { value: "transport", label: "Транспорт", emoji: "🚗" },
  { value: "housing", label: "Жильё", emoji: "🏠" },
  { value: "entertainment", label: "Развлечения", emoji: "🎉" },
  { value: "shopping", label: "Покупки", emoji: "🛍️" },
  { value: "gift", label: "Подарки", emoji: "🎁" },
  { value: "health", label: "Здоровье", emoji: "💊" },
  { value: "education", label: "Образование", emoji: "📚" },
  { value: "other", label: "Другое", emoji: "📌" },
];

export function getCategoryEmoji(category: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === category)?.emoji || "📌";
}

export function getCategoryLabel(category: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label || "Другое";
}
