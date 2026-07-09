import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFriendStore } from "@/stores/friendStore";
import { useAuthStore } from "@/stores/authStore";
import { useFriendsWithBalances } from "@/hooks/useFriendsWithBalances";
import { FriendCard } from "@/components/friends/FriendCard";
import { FriendRequests } from "@/components/friends/FriendRequests";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Search, Loader2, LogIn, UserRoundPlus } from "lucide-react";

export default function FriendsPage() {
  const { friends, totalFriends, friendsWithDebts } = useFriendsWithBalances();
  const syncStatus = useFriendStore((s) => s.syncStatus);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");

  // Filter friends by search (search across all friends)

  // Filter friends by search (search across all friends)
  const filtered = friends.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.username.toLowerCase().includes(q) ||
      (f.phone || "").toLowerCase().includes(q)
    );
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Users className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Друзья</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Войдите в аккаунт, чтобы добавлять друзей и делиться расходами
        </p>
        <Button onClick={() => navigate("/auth")}>
          <LogIn className="w-4 h-4 mr-2" /> Войти
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 h-12">
          <h1 className="text-xl font-bold">Друзья</h1>
          <div className="flex items-center gap-2">
            {syncStatus === "syncing" && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
            <Button size="sm" onClick={() => navigate("/add-friend")} className="gap-1.5">
              <UserPlus className="w-4 h-4" /> Добавить
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Поиск среди друзей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm rounded-xl bg-muted border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Sync state */}
        {syncStatus === "syncing" && totalFriends === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Friend requests section */}
        <FriendRequests />

        {/* Summary bar */}
        {totalFriends > 0 && !searchQuery && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground px-1 pb-1">
            <span>Всего {totalFriends}</span>
            {friendsWithDebts.length > 0 && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-emerald-600/70 dark:text-emerald-400/70">
                  {friendsWithDebts.length} с долгами
                </span>
              </>
            )}
          </div>
        )}

        {/* Friends list */}
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((friend, i) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                index={i}
                onClick={() => navigate(`/friends/${friend.userId}`)}
              />
            ))}
          </div>
        ) : totalFriends > 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm text-muted-foreground">Друзья не найдены</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UserRoundPlus className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium mb-1">У вас пока нет друзей</p>
            <p className="text-xs text-muted-foreground mb-4">
              Добавьте друзей, чтобы делиться расходами
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate("/add-friend")}>
              <UserPlus className="w-4 h-4 mr-1.5" /> Найти друзей
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
