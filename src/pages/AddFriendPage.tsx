import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFriendStore } from "@/stores/friendStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/formatters";
import { ArrowLeft, Search, UserPlus, Loader2, X, CheckCircle2 } from "lucide-react";

export default function AddFriendPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; username: string; avatar?: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [successMap, setSuccessMap] = useState<Record<string, boolean>>({});
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

  const handleSendRequest = async (userId: string) => {
    setError("");
    const result = await sendRequest(userId);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccessMap((prev) => ({ ...prev, [userId]: true }));
      // Clear success after 3s
      setTimeout(() => {
        setSuccessMap((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }, 3000);
    }
  };

  const goBack = () => navigate("/friends");

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header with back button */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 px-4 h-12">
          <button
            onClick={goBack}
            className="p-1 -ml-1 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Добавить друга</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Поиск по имени или @username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-muted/50 border-border/50 text-base focus-visible:ring-primary/30"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setError("");
                inputRef.current?.focus();
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-xl px-4 py-2.5">
            {error}
          </div>
        )}

        {/* Search hint */}
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Найдите пользователя</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Введите имя или @username для поиска
            </p>
          </div>
        )}

        {/* Loading */}
        {searching && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Results */}
        {!searching && results.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-1">
              Найдено {results.length}{" "}
              {results.length === 1 ? "пользователь" : "пользователей"}
            </p>
            <div className="space-y-1 mt-2">
              {results.map((user) => {
                const isSent = successMap[user.id];
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 hover:border-border/80 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-muted">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={cn(
                          "w-full h-full flex items-center justify-center text-sm font-bold text-white",
                          getAvatarColor(user.name)
                        )}>
                          {getInitials(user.name)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>

                    {/* Action */}
                    {isSent ? (
                      <div className="flex items-center gap-1 text-xs text-positive font-semibold shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> Отправлено
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="h-9 gap-1.5 text-xs shrink-0 rounded-xl"
                        onClick={() => handleSendRequest(user.id)}
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Добавить
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No results */}
        {!searching && query.trim() && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Ничего не найдено</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Попробуйте изменить поисковый запрос
            </p>
          </div>
        )}
      </div>
    </div>
  );
}