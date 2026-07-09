import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/hooks/useFriendAnalytics";

interface FriendAchievementsProps {
  achievements: Achievement[];
  compact?: boolean;
}

const rarityGradients: Record<string, string> = {
  legendary: "from-amber-400 via-orange-400 to-rose-400",
  epic: "from-violet-400 via-purple-400 to-fuchsia-400",
  rare: "from-blue-400 via-cyan-400 to-sky-400",
  common: "from-zinc-300 via-zinc-400 to-zinc-500",
};

const rarityBadge: Record<string, string> = {
  legendary: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  epic: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  rare: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  common: "bg-muted text-muted-foreground",
};

export default function FriendAchievements({ achievements, compact = false }: FriendAchievementsProps) {
  const unlocked = achievements.filter((a) => a.unlocked);

  if (unlocked.length === 0 && compact) return null;

  return (
    <div className="space-y-3">
      {/* Top achievement hero */}
      {unlocked.length > 0 && !compact && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center py-6 px-4 rounded-2xl bg-gradient-to-br from-card/80 to-card border border-border/50 relative overflow-hidden"
        >
          {/* Background glow */}
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl opacity-10",
              unlocked[0].rarity === "legendary" ? "bg-amber-400" :
              unlocked[0].rarity === "epic" ? "bg-violet-400" :
              unlocked[0].rarity === "rare" ? "bg-blue-400" : "bg-zinc-400"
          )} />

          <div className="relative">
            {/* Emoji badge */}
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3",
              "bg-gradient-to-br",
              rarityGradients[unlocked[0].rarity]
            )}>
              {unlocked[0].icon}
            </div>

            <h3 className="text-lg font-bold text-foreground mb-1">
              {unlocked[0].title}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {unlocked[0].description}
            </p>

            <span className={cn(
              "inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
              rarityBadge[unlocked[0].rarity]
            )}>
              {unlocked[0].rarity === "legendary" ? "Легендарно" :
               unlocked[0].rarity === "epic" ? "Эпично" :
               unlocked[0].rarity === "rare" ? "Редко" : "Обычно"}
            </span>
          </div>
        </motion.div>
      )}

      {/* All achievements grid */}
      <div className={cn(
        compact ? "flex flex-wrap gap-1.5" : "grid grid-cols-2 gap-2"
      )}>
        {(compact ? unlocked : achievements).map((achievement, i) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            className={cn(
              "rounded-xl p-3 transition-all duration-200",
              achievement.unlocked
                ? compact
                  ? "bg-gradient-to-br from-card to-card border border-border/40"
                  : "bg-card border border-border/40 hover:border-border/70"
                : "bg-muted/30 border border-dashed border-border/30 opacity-50"
            )}
          >
            <div className={cn(
              "flex items-center gap-2.5",
              compact && "gap-1.5"
            )}>
              {/* Mini icon */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0",
                achievement.unlocked
                  ? cn("bg-gradient-to-br", rarityGradients[achievement.rarity])
                  : "bg-muted"
              )}>
                {achievement.unlocked ? achievement.icon : "🔒"}
              </div>

              {!compact && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                    {achievement.title}
                    <span className={cn(
                      "text-[8px] px-1 py-0.5 rounded font-semibold uppercase tracking-wider",
                      rarityBadge[achievement.rarity]
                    )}>
                      {achievement.rarity === "legendary" ? "LEG" :
                       achievement.rarity === "epic" ? "EPIC" :
                       achievement.rarity === "rare" ? "RARE" : ""}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {achievement.description}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
