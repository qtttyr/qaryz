import { cn } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/formatters";
import { motion } from "framer-motion";

interface FriendCardProps {
  name: string;
  username: string;
  avatar?: string;
  phone?: string;
  onClick?: () => void;
}

export function FriendCard({ name, username, avatar, phone, onClick }: FriendCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 hover:border-border/80 transition-colors text-left"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-muted">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className={cn(
            "w-full h-full flex items-center justify-center text-sm font-bold text-white",
            getAvatarColor(name)
          )}>
            {getInitials(name)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">@{username}</p>
        {phone && (
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">{phone}</p>
        )}
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
