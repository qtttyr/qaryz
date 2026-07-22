import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "./MemberAvatar";
import { CheckCircle2, ChevronDown, ArrowRight, Receipt, Sparkles } from "lucide-react";
import { simplifyDebts } from "@/lib/groupSettlementToDebt";

// ─── Types ─────────────────────────────────────────────────

interface BalanceEntry {
  userId: string;
  balance: number;
  name: string;
}

interface GroupSettlementSummaryProps {
  balances: BalanceEntry[];
  activeTotal: number;
  activeCount: number;
  settledCount: number;
  currentUserId: string;
  onSettleAll: () => Promise<void>;
}

// ─── Component ────────────────────────────────────────────

export function GroupSettlementSummary({
  balances,
  activeTotal,
  activeCount,
  settledCount,
  currentUserId,
  onSettleAll,
}: GroupSettlementSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const [settling, setSettling] = useState(false);
  const [settled, setSettled] = useState(false);

  const hasActive = activeCount > 0;
  const allSettled = activeCount === 0 && settledCount > 0;

  const activeBalances = useMemo(() => {
    if (!hasActive) return [];
    return balances.filter((b) => Math.abs(b.balance) > 0.01);
  }, [balances, hasActive]);

  const transactions = useMemo(() => {
    if (!hasActive || activeBalances.length === 0) return [];
    return simplifyDebts(activeBalances);
  }, [hasActive, activeBalances]);

  const handleSettleAll = async () => {
    if (settling || settled) return;
    setSettling(true);
    try {
      await onSettleAll();
      setSettled(true);
    } catch {
      // Ошибка обрабатывается в родителе
    } finally {
      setSettling(false);
    }
  };

  // ── All settled state ──
  if (allSettled || settled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 px-5 py-5 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          Счёт закрыт 🎉
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Все расходы погашены. Никто никому не должен.
        </p>
      </motion.div>
    );
  }

  // ── No active expenses — nothing to show ──
  if (!hasActive) return null;

  return (
    <div className="rounded-2xl bg-muted/20 border border-border/20 overflow-hidden">
      {/* ── Header toggle ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Закрыть весь счёт</p>
            <p className="text-[11px] text-muted-foreground/60">
              {activeCount} {activeCount === 1 ? "активный расход" : "активных расходов"} ·{" "}
              {activeTotal.toLocaleString()} ₸
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground/50 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* ── Expanded content ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="settlement-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border/10 pt-4">
              {/* ── Balances ── */}
              {activeBalances.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2">
                    Баланс
                  </p>
                  {activeBalances.map((b) => (
                    <div
                      key={b.userId}
                      className="flex items-center gap-2.5 py-1.5"
                    >
                      <MemberAvatar
                        name={b.name}
                        size="sm"
                      />
                      <span className="text-sm flex-1 min-w-0 truncate">
                        {b.name}
                        {b.userId === currentUserId && (
                          <span className="text-muted-foreground/40 ml-1 text-xs">
                            (вы)
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          b.balance > 0
                            ? "text-emerald-500"
                            : "text-red-500"
                        )}
                      >
                        {b.balance > 0 ? "+" : ""}
                        {b.balance.toLocaleString()} ₸
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Simplified settlements ── */}
              {transactions.length > 0 && (
                <div className="space-y-2">
                  <div className="border-t border-border/10 pt-3">
                    <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2.5">
                      Кто кому должен
                    </p>
                    <div className="space-y-2">
                      {transactions.map((tx, i) => (
                        <motion.div
                          key={`${tx.from}-${tx.to}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/30"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-sm font-medium truncate">
                              {tx.fromName}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {tx.toName}
                            </span>
                          </div>
                          <span className="text-sm font-bold tabular-nums text-foreground shrink-0">
                            {tx.amount.toLocaleString()} ₸
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Settle button ── */}
              <div className="pt-1">
                <Button
                  onClick={handleSettleAll}
                  disabled={settling}
                  className="w-full h-11 rounded-xl text-sm font-semibold gap-2"
                >
                  {settling ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                      Закрытие...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Подтвердить закрытие счёта
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                  После закрытия расходы будут отмечены как погашенные для всех участников
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
