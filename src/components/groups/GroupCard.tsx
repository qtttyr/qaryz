import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface GroupCardProps {
  id: string;
  name: string;
  emoji: string;
  photo?: string;
  memberCount: number;
  total: number;
  onClick?: () => void;
}

const GRADIENTS = [
  "from-primary/10 via-primary/5 to-transparent",
  "from-amber-500/10 via-amber-500/5 to-transparent",
  "from-emerald-500/10 via-emerald-500/5 to-transparent",
  "from-violet-500/10 via-violet-500/5 to-transparent",
  "from-rose-500/10 via-rose-500/5 to-transparent",
  "from-sky-500/10 via-sky-500/5 to-transparent",
];

const AVATAR_BG = [
  "bg-primary/10",
  "bg-amber-500/10",
  "bg-emerald-500/10",
  "bg-violet-500/10",
  "bg-rose-500/10",
  "bg-sky-500/10",
];

function getColorIndex(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % GRADIENTS.length;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function GroupCard({ name, photo, memberCount, total, onClick }: GroupCardProps) {
  const colorIdx = getColorIndex(name);

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full relative overflow-hidden rounded-2xl border border-border/50 bg-card",
        "hover:border-border hover:shadow-sm transition-all duration-200 text-left"
      )}
    >
      {/* Gradient accent */}
      <div className={cn("absolute inset-0 bg-linear-to-br", GRADIENTS[colorIdx])} />

      <div className="relative p-4 flex items-center gap-4">
        {/* Avatar — photo or initials */}
        <div className={cn(
          "flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center",
          "shadow-xs",
          !photo && AVATAR_BG[colorIdx]
        )}>
          {photo ? (
            <img src={photo} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-foreground/70">{getInitials(name)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate text-foreground">{name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {memberCount} {memberCount === 1 ? "участник" : memberCount < 5 ? "участника" : "участников"}
            </span>
            {total > 0 && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-xs font-medium text-foreground/80">
                  {total.toLocaleString()} ₸
                </span>
              </>
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
      </div>
    </motion.button>
  );
}
