import { motion } from "framer-motion";
import { useUserStore } from "@/stores/userStore";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface OverviewCardProps {
  totalOwedToMe: number;
  totalIOwe: number;
  balance: number;
}

export default function OverviewCard({
  totalOwedToMe,
  totalIOwe,
  balance,
}: OverviewCardProps) {
  const currency = useUserStore((s) => s.profile.currency);
  const isPositive = balance >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-5"
    >
      {/* Gradient accent line */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5",
          isPositive
            ? "bg-linear-to-r from-positive/80 to-positive/20"
            : "bg-linear-to-r from-negative/80 to-negative/20"
        )}
      />

      {/* Balance */}
      <div className="text-center mb-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Общий баланс
        </p>
        <p
          className={cn(
            "text-3xl font-bold tabular-nums",
            isPositive ? "text-positive" : "text-negative"
          )}
        >
          {isPositive ? "+" : "−"}
          {formatCurrency(balance, currency)}
        </p>
      </div>

      {/* Breakdown */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl bg-positive/8 p-3.5 text-center">
          <p className="text-[11px] text-muted-foreground mb-0.5">
            Мне должны
          </p>
          <p className="text-base font-bold text-positive tabular-nums">
            +{formatCurrency(totalOwedToMe, currency)}
          </p>
        </div>
        <div className="flex-1 rounded-xl bg-negative/8 p-3.5 text-center">
          <p className="text-[11px] text-muted-foreground mb-0.5">
            Я должен
          </p>
          <p className="text-base font-bold text-negative tabular-nums">
            −{formatCurrency(totalIOwe, currency)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
