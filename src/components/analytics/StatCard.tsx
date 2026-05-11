import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: "positive" | "negative" | "primary" | "muted";
  index?: number;
}

export default function StatCard({
  label,
  value,
  icon,
  accent = "primary",
  index = 0,
}: StatCardProps) {
  const accentStyles = {
    positive: "bg-positive/10 text-positive",
    negative: "bg-negative/10 text-negative",
    primary: "bg-primary/10 text-primary",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.06,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="rounded-2xl bg-card border border-border/50 p-4 flex items-start gap-3"
    >
      {icon && (
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            accentStyles[accent]
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold text-foreground tabular-nums mt-0.5 truncate">
          {value}
        </p>
      </div>
    </motion.div>
  );
}
