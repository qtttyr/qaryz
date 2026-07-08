import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  total: number;
  balance: number;
  onClick?: () => void;
}

export function GroupCard({ name, emoji, memberCount, total, balance, onClick }: GroupCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
        "border border-border/50 bg-card dark:bg-card"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{name}</h3>
          <p className="text-sm text-muted-foreground">
            {memberCount} {memberCount === 1 ? "участник" : memberCount < 5 ? "участника" : "участников"}
            {" · "}
            {total > 0 ? `${total.toLocaleString()} ₸` : "нет расходов"}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className={cn(
            "font-semibold text-sm",
            balance > 0 && "text-emerald-500",
            balance < 0 && "text-red-500",
            balance === 0 && "text-muted-foreground"
          )}>
            {balance > 0 ? "+" : ""}{balance.toLocaleString()} ₸
          </p>
          <p className="text-xs text-muted-foreground">баланс</p>
        </div>
      </CardContent>
    </Card>
  );
}
