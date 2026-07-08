import { useState, useRef, useEffect } from "react";
import { useFriendStore } from "@/stores/friendStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/formatters";
import { Search, UserPlus, Loader2, X } from "lucide-react";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; username: string; avatar?: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const searchUsers = useFriendStore((s) => s.searchUsers);
  const sendRequest = useFriendStore((s) => s.sendRequest);

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await searchUsers(query);
      setResults(res);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const handleSendRequest = async (userId: string, name: string) => {
    setError("");
    setSuccess("");
    const result = await sendRequest(userId);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(`Заявка отправлена ${name}`);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Поиск по имени или @username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-10 text-sm"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status messages */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-xs text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2">{success}</p>
      )}

      {/* Results */}
      {searching && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-muted">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={cn(
                    "w-full h-full flex items-center justify-center text-xs font-bold text-white",
                    getAvatarColor(user.name)
                  )}>
                    {getInitials(user.name)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs shrink-0"
                onClick={() => handleSendRequest(user.id, user.name)}
              >
                <UserPlus className="w-3.5 h-3.5" /> Добавить
              </Button>
            </div>
          ))}
        </div>
      )}

      {!searching && query.trim() && results.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Пользователи не найдены
        </p>
      )}
    </div>
  );
}
