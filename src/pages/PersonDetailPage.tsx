import { useParams, useNavigate } from "react-router-dom";
import { useDebtStore } from "@/stores/debtStore";
import { useUserStore } from "@/stores/userStore";
import { useUIStore } from "@/stores/uiStore";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import TransactionList from "@/components/debts/TransactionList";
import ReminderButton from "@/components/debts/ReminderButton";

import { formatCurrency, getInitials, getAvatarColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getPerson = useDebtStore((s) => s.getPerson);
  const getPersonBalance = useDebtStore((s) => s.getPersonBalance);
  const openModal = useUIStore((s) => s.openModal);
  const currency = useUserStore((s) => s.profile.currency);
  const syncFromSupabase = useDebtStore((s) => s.syncFromSupabase);
  const syncStatus = useDebtStore((s) => s.syncStatus);

  const person = id ? getPerson(id) : null;
  const balance = id ? getPersonBalance(id) : 0;
  const isPositive = balance >= 0;

  if (!person) {
    return (
      <PullToRefresh onRefresh={syncFromSupabase} disabled={syncStatus === "syncing"}>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground font-medium">Человек не найден</p>
        <Button variant="link" onClick={() => navigate("/")}>
          Вернуться назад
        </Button>
      </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={syncFromSupabase} disabled={syncStatus === "syncing"}>
    <div className="flex flex-col min-h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 -mx-4 px-4 py-3 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white font-bold bg-linear-to-br",
                getAvatarColor(person.id)
              )}
            >
              {person.avatar ? (
                <img src={person.avatar} className="w-full h-full rounded-full object-cover" alt="" />
              ) : (
                getInitials(person.name)
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground leading-none">{person.name}</span>
              {person.phone && (
                <span className="text-[10px] text-muted-foreground mt-0.5">{person.phone}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="rounded-3xl bg-card border border-border/50 p-6 mb-8 text-center relative overflow-hidden">
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          isPositive ? "bg-positive/50" : "bg-negative/50"
        )} />
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Текущий баланс</p>
        <h2 className={cn(
          "text-4xl font-black tabular-nums tracking-tight",
          isPositive ? "text-positive" : "text-negative"
        )}>
          {isPositive ? "+" : "−"}
          {formatCurrency(balance, currency)}
        </h2>
        
        <div className="flex items-center justify-center gap-2 mt-6">
          <ReminderButton personId={person.id} />
          <Button 
            onClick={() => openModal("add-debt", { personId: person.id })}
            className="gap-2 rounded-xl"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} />
            Добавить долг
          </Button>
        </div>
      </div>

      {/* Transaction Feed Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-semibold text-muted-foreground">История операций</h3>
        <span className="text-[11px] text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
          Всё время
        </span>
      </div>

      {/* History */}
      <div className="flex-1">
        <TransactionList personId={person.id} />
      </div>
    </div>
    </PullToRefresh>
  );
}
