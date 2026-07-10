import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { PersonWithBalance } from "@/hooks/usePeople";
import { useUserStore } from "@/stores/userStore";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  getInitials,
  timeAgo,
  getAvatarColor,
  pluralize,
} from "@/lib/formatters";

interface PersonCardProps {
  person: PersonWithBalance;
  index?: number;
}

export default memo(function PersonCard({ person, index = 0 }: PersonCardProps) {
  const navigate = useNavigate();
  const currency = useUserStore((s) => s.profile.currency);
  const isPositive = person.balance > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <button
        onClick={() => navigate(`/person/${person.id}`)}
        className="w-full group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-border hover:bg-accent/30 transition-all duration-200 cursor-pointer text-left"
      >
        {/* Avatar */}
        <div
          className={cn(
            "relative w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-linear-to-br shrink-0",
            getAvatarColor(person.id)
          )}
        >
          {person.avatar ? (
            <img
              src={person.avatar}
              alt={person.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(person.name)
          )}
          {/* Active indicator dot */}
          {person.activeDebtsCount > 0 && (
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card",
                isPositive ? "bg-positive" : "bg-negative"
              )}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-foreground truncate">
              {person.name}
            </span>
            <span
              className={cn(
                "text-sm font-bold tabular-nums whitespace-nowrap",
                isPositive ? "text-positive" : "text-negative"
              )}
            >
              {isPositive ? "+" : "−"}
              {formatCurrency(person.balance, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {person.activeDebtsCount > 0
                ? `${person.activeDebtsCount} ${pluralize(person.activeDebtsCount, ["активный долг", "активных долга", "активных долгов"])}`
                : "Нет активных долгов"}
            </span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(person.lastActivity)}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={18}
          className="text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
        />
      </button>
    </motion.div>
  );
}, (prev, next) => prev.person.id === next.person.id && prev.index === next.index);
