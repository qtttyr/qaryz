import { motion } from "framer-motion";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon } from "@hugeicons/core-free-icons";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  children: React.ReactNode;
  /** Classes for the inner content wrapper (flex layout, etc.) */
  contentClassName?: string;
  /** Classes for the outer touch wrapper (usually not needed) */
  wrapperClassName?: string;
}

export default function PullToRefresh({
  onRefresh,
  disabled = false,
  children,
  contentClassName,
  wrapperClassName,
}: PullToRefreshProps) {
  const { pullDistance, isRefreshing, handlers } = usePullToRefresh({
    onRefresh,
    disabled,
  });

  const isReady = pullDistance >= 60;

  return (
    <div
      {...handlers}
      className={cn("relative touch-pan-y", wrapperClassName)}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <motion.div
          initial={false}
          className="absolute left-0 right-0 flex items-center justify-center overflow-hidden z-20 pointer-events-none"
          style={{
            top: Math.max(pullDistance - 40, -10),
            height: 40,
            opacity: Math.min(pullDistance / 40, 1),
          }}
        >
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : isReady ? 180 : 0,
              scale: isRefreshing ? 1 : isReady ? 1.1 : 1,
            }}
            transition={{
              rotate: isRefreshing
                ? { repeat: Infinity, duration: 1, ease: "linear" }
                : { duration: 0.3 },
              scale: { duration: 0.2 },
            }}
          >
            <HugeiconsIcon
              icon={Loading02Icon}
              size={22}
              className={cn(
                "transition-colors duration-200",
                isRefreshing
                  ? "text-primary"
                  : isReady
                    ? "text-primary"
                    : "text-muted-foreground/60"
              )}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Content */}
      <div
        className={contentClassName}
        style={{
          transform: `translateY(${Math.min(pullDistance, 60)}px)`,
          transition: isRefreshing || pullDistance === 0
            ? "transform 0.3s ease"
            : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}