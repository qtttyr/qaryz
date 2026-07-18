import { useState, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useFriendStore } from "@/stores/friendStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Search, Check, Users, X } from "lucide-react";

interface MemberSelectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function MemberSelector({ selected, onChange }: MemberSelectorProps) {
  const user = useAuthStore((s) => s.user);
  const friends = useFriendStore((s) => s.friends);
  const [searchQuery, setSearchQuery] = useState("");

  // Get friends with "other" user perspective
  const friendProfiles = useMemo(() => {
    if (!user) return [];
    return friends.map((f) => {
      const otherId = f.userId === user.id ? f.friendId : f.userId;
      return {
        id: otherId,
        name: f.name || "Пользователь",
        username: f.username || "user",
        avatar: f.avatar,
      };
    }).filter((f) =>
      !searchQuery.trim() ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, user, searchQuery]);

  const toggleMember = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => {
    onChange(friendProfiles.map((f) => f.id));
  };

  const deselectAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Поиск друзей..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-3 text-sm rounded-xl bg-muted border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow placeholder:text-muted-foreground/50"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-muted-foreground/50" />
          </button>
        )}
      </div>

      {/* Selected count + actions */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {selected.length > 0
            ? `Выбрано: ${selected.length} из ${friendProfiles.length}`
            : `${friendProfiles.length} друзей`}
        </span>
        <div className="flex gap-2">
          {selected.length < friendProfiles.length && (
            <button onClick={selectAll} className="text-primary font-medium hover:underline">
              Выбрать всех
            </button>
          )}
          {selected.length > 0 && (
            <button onClick={deselectAll} className="text-muted-foreground font-medium hover:underline">
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Friends list */}
      {friendProfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Друзья не найдены" : "У вас пока нет друзей"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {!searchQuery && "Добавьте друзей, чтобы создать группу"}
          </p>
        </div>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {friendProfiles.map((friend, i) => {
            const isSelected = selected.includes(friend.id);
            return (
              <motion.button
                key={friend.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                onClick={() => toggleMember(friend.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left",
                  isSelected
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "hover:bg-muted/50"
                )}
              >
                {/* Avatar */}
                {friend.avatar ? (
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0",
                    isSelected ? "bg-primary" : "bg-muted-foreground/30"
                  )}>
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{friend.name}</p>
                  <p className="text-[11px] text-muted-foreground/60 truncate">
                    @{friend.username}
                  </p>
                </div>

                {/* Checkbox */}
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
