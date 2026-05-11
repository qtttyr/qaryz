import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Tick01Icon,
  MoneyReceive01Icon,
} from "@hugeicons/core-free-icons";
import { useDebtStore } from "@/stores/debtStore";
import { useUserStore } from "@/stores/userStore";
import { useUIStore } from "@/stores/uiStore";
import { formatCurrency, timeAgo } from "@/lib/formatters";
import type { Debt, Payment } from "@/types/debt";
import { cn } from "@/lib/utils";

interface TransactionListProps {
  personId: string;
}

interface TimelineEntry {
  type: "debt" | "payment";
  data: Debt | Payment;
  date: string;
  debtDirection?: "owed_to_me" | "i_owe";
}

export default function TransactionList({ personId }: TransactionListProps) {
  const debts = useDebtStore((s) => s.debts);
  const payments = useDebtStore((s) => s.payments);
  const currency = useUserStore((s) => s.profile.currency);
  const openModal = useUIStore((s) => s.openModal);

  const personDebts = debts.filter((d) => d.personId === personId);

  // Build timeline entries
  const entries: TimelineEntry[] = [];

  for (const debt of personDebts) {
    entries.push({
      type: "debt",
      data: debt,
      date: debt.createdAt,
      debtDirection: debt.direction,
    });

    const debtPayments = payments.filter((p) => p.debtId === debt.id);
    for (const payment of debtPayments) {
      entries.push({
        type: "payment",
        data: payment,
        date: payment.createdAt,
        debtDirection: debt.direction,
      });
    }
  }

  // Sort by date (newest first)
  entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <HugeiconsIcon
            icon={MoneyReceive01Icon}
            size={28}
            className="text-muted-foreground/50"
          />
        </div>
        <p className="text-muted-foreground text-sm">
          Пока нет записей
        </p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Нажмите + чтобы добавить
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const isDebt = entry.type === "debt";
        const debt = isDebt ? (entry.data as Debt) : null;
        const payment = !isDebt ? (entry.data as Payment) : null;

        // For debts: owed_to_me = green (they borrowed from you), i_owe = red
        // For payments: opposite (money coming back)
        const isPositiveFlow = isDebt
          ? entry.debtDirection === "owed_to_me"
          : entry.debtDirection === "i_owe";

        return (
          <motion.div
            key={entry.data.id}
            initial={{ opacity: 0, x: isPositiveFlow ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          >
            <div
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-2xl transition-colors",
                isDebt
                  ? "bg-card border border-border/50"
                  : "bg-muted/30 border border-border/30"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  isDebt
                    ? isPositiveFlow
                      ? "bg-positive/15 text-positive"
                      : "bg-negative/15 text-negative"
                    : "bg-primary/15 text-primary"
                )}
              >
                <HugeiconsIcon
                  icon={
                    isDebt
                      ? isPositiveFlow
                        ? ArrowDown01Icon
                        : ArrowUp01Icon
                      : debt?.settledAt
                        ? Tick01Icon
                        : MoneyReceive01Icon
                  }
                  size={18}
                  strokeWidth={2}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {isDebt
                      ? entry.debtDirection === "owed_to_me"
                        ? "Взял в долг"
                        : "Вы взяли в долг"
                      : payment?.type === "full"
                        ? "Полное погашение"
                        : "Частичная оплата"}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      isDebt
                        ? isPositiveFlow
                          ? "text-positive"
                          : "text-negative"
                        : "text-primary"
                    )}
                  >
                    {isDebt ? "" : "−"}
                    {formatCurrency(entry.data.amount, currency)}
                  </span>
                </div>

                {/* Description / note */}
                {(debt?.description || payment?.note) && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {debt?.description || payment?.note}
                  </p>
                )}

                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] text-muted-foreground/60">
                    {timeAgo(entry.date)}
                  </span>

                  {/* Pay button for active debts */}
                  {isDebt && !debt?.settledAt && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal("add-payment", { debtId: debt?.id });
                      }}
                      className="text-[11px] text-primary font-medium hover:underline"
                    >
                      Погасить
                    </button>
                  )}

                  {/* Settled badge */}
                  {isDebt && debt?.settledAt && (
                    <span className="text-[11px] text-positive font-medium flex items-center gap-1">
                      <HugeiconsIcon icon={Tick01Icon} size={12} />
                      Закрыт
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
