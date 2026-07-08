import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "./MemberAvatar";
import type { Expense, ExpenseShare } from "@/types/group";

interface ExpenseCardProps {
  expense: Expense;
  shares: (ExpenseShare & { name?: string })[];
  paidByName?: string;
}

const categoryMap: Record<string, { label: string; emoji: string }> = {
  food: { label: "Еда", emoji: "🍽️" },
  transport: { label: "Транспорт", emoji: "🚕" },
  entertainment: { label: "Развлечения", emoji: "🎉" },
  shopping: { label: "Покупки", emoji: "🛍️" },
  bills: { label: "Счета", emoji: "📄" },
  housing: { label: "Жильё", emoji: "🏠" },
  health: { label: "Здоровье", emoji: "💊" },
  other: { label: "Прочее", emoji: "📌" },
};

export function ExpenseCard({ expense, shares, paidByName }: ExpenseCardProps) {
  const cat = categoryMap[expense.category] || categoryMap.other;

  return (
    <Card className="border border-border/50 bg-card dark:bg-card">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">
            {cat.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm truncate">{expense.description}</p>
              <p className="font-semibold text-sm whitespace-nowrap ml-2">
                {expense.amount.toLocaleString()} ₸
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {paidByName && `${paidByName} оплатил(а)`}
            </p>

            {shares.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {shares.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]",
                      s.settled
                        ? "bg-muted text-muted-foreground line-through"
                        : "bg-primary/5 text-foreground"
                    )}
                  >
                    <MemberAvatar name={s.name || ""} size="sm" />
                    <span>{s.shareAmount.toLocaleString()} ₸</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(expense.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
