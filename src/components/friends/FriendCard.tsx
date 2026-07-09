import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/formatters";
import type { FriendWithBalance } from "@/hooks/useFriendsWithBalances";

interface FriendCardProps {
  friend: FriendWithBalance;
  onClick?: () => void;
  index?: number;
}

export function FriendCard({ friend, onClick, index = 0 }: FriendCardProps) {
  const hasDebts = friend.activeDebtsCount > 0;
  const isPositive = friend.balance > 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-border hover:bg-accent/30 transition-all duration-200 text-left"
    >
      {/* Avatar — Instagram-style ring */}
      <div className="relative shrink-0">
        <div
          className={cn(
            "w-14 h-14 rounded-full overflow-hidden bg-muted",
            hasDebts && "ring-2 ring-offset-2 ring-offset-background",
            hasDebts && (isPositive ? "ring-emerald-500/60" : "ring-red-500/60")
          )}
        >
          {friend.avatar ? (
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-full h-full flex items-center justify-center text-base font-bold text-white",
                getAvatarColor(friend.name)
              )}
            >
              {getInitials(friend.name)}
            </div>
          )}
        </div>
        {/* Active debt dot */}
        {hasDebts && (
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-card",
              isPositive ? "bg-emerald-500" : "bg-red-500"
            )}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-foreground truncate text-sm">
            {friend.name}
          </span>
          {hasDebts && (
            <span
              className={cn(
                "text-sm font-bold tabular-nums whitespace-nowrap",
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {isPositive ? "+" : "−"}
              {Math.abs(friend.balance).toLocaleString()} ₸
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted-foreground truncate">
              @{friend.username}
            </span>
            {hasDebts && (
              <span className="text-[11px] text-muted-foreground/60 shrink-0">
                · {friend.activeDebtsCount}{" "}
                {friend.activeDebtsCount === 1
                  ? "долг"
                  : friend.activeDebtsCount < 5
                    ? "долга"
                    : "долгов"}
              </span>
            )}
          </div>
          {!hasDebts && (
            <span className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 font-medium shrink-0">
              Нет долгов
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <svg
        className="w-4 h-4 text-muted-foreground/40 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}
