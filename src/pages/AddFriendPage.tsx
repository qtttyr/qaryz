import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useFriendStore } from "@/stores/friendStore";
import { useAuthStore } from "@/stores/authStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/formatters";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, Search, UserPlus, Loader2, X,
  CheckCircle2, UserRoundX, LogIn, Send,
} from "lucide-react";

type ProfileMode =
  | { type: "loading" }
  | { type: "self" }
  | { type: "not_found" }
  | { type: "already_friends" }
  | { type: "request_sent" }
  | { type: "request_pending" }
  | { type: "addable"; profile: { id: string; name: string; username: string; avatar?: string } }
  | { type: "auth_required" }
  | { type: "error"; message: string };

export default function AddFriendPage() {
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get("user");

  // Detect if we have a specific user to show
  const targetUserId = routeUserId || queryUserId || null;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; username: string; avatar?: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [successMap, setSuccessMap] = useState<Record<string, boolean>>({});

  const [profileMode, setProfileMode] = useState<ProfileMode | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchUsers = useFriendStore((s) => s.searchUsers);
  const sendRequest = useFriendStore((s) => s.sendRequest);
  const friends = useFriendStore((s) => s.friends);
  const incomingRequests = useFriendStore((s) => s.incomingRequests);
  const outgoingRequests = useFriendStore((s) => s.outgoingRequests);
  const user = useAuthStore((s) => s.user);

  // ── Handle profile mode from ?user=ID or :userId ──
  useEffect(() => {
    if (!targetUserId) {
      setProfileMode(null);
      return;
    }

    const loadProfile = async () => {
      setProfileMode({ type: "loading" });

      // Self?
      if (user && targetUserId === user.id) {
        setProfileMode({ type: "self" });
        return;
      }

      // Already friends?
      if (user) {
        const isFriend = friends.some((f) => {
          const otherId = f.userId === user.id ? f.friendId : f.userId;
          return otherId === targetUserId;
        });
        if (isFriend) {
          setProfileMode({ type: "already_friends" });
          return;
        }

        // Already sent a request?
        const hasPending = outgoingRequests.some((r) => r.receiverId === targetUserId);
        if (hasPending) {
          setProfileMode({ type: "request_sent" });
          return;
        }

        // Received a request from them?
        const hasIncoming = incomingRequests.some((r) => r.senderId === targetUserId);
        if (hasIncoming) {
          setProfileMode({ type: "request_pending" });
          return;
        }
      }

      // Not authenticated → show login prompt (skip DB fetch, RLS would block it)
      if (!user) {
        setProfileMode({ type: "auth_required" });
        return;
      }

      // Fetch profile from DB
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, name, username, avatar_url")
          .eq("id", targetUserId)
          .single();

        if (profile) {
          setProfileMode({ type: "addable", profile: { id: profile.id, name: profile.name, username: profile.username, avatar: profile.avatar_url } });
        } else {
          setProfileMode({ type: "not_found" });
        }
      } catch {
        setProfileMode({ type: "not_found" });
      }
    };

    loadProfile();
  }, [targetUserId, user?.id, friends, outgoingRequests, incomingRequests, user]);

  // ── Debounce search (only in search mode) ──
  useEffect(() => {
    if (targetUserId) return; // skip search when in profile mode
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
  }, [query, searchUsers, targetUserId]);

  const handleSendRequest = async (userId: string) => {
    setError("");
    const result = await sendRequest(userId);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccessMap((prev) => ({ ...prev, [userId]: true }));
      // In profile mode, switch to request_sent
      if (targetUserId) {
        setProfileMode({ type: "request_sent" });
      }
      setTimeout(() => {
        setSuccessMap((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }, 3000);
    }
  };

  const goBack = () => {
    navigate("/friends");
  };

  const navigateToProfile = (userId: string) => {
    navigate(`/add-friend/${userId}`);
  };

  const title = targetUserId ? "Профиль" : "Добавить друга";

  // ── Render ──
  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 px-4 h-12">
          <button
            onClick={goBack}
            className="p-1 -ml-1 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* ── PROFILE MODE ── */}
        {targetUserId && profileMode && (
          <>
            {profileMode.type === "loading" && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {profileMode.type === "self" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UserRoundX className="w-8 h-8 text-primary/60" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Это вы</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Нельзя добавить самого себя в друзья
                </p>
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Назад
                </Button>
              </div>
            )}

            {profileMode.type === "not_found" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Пользователь не найден</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Возможно, ссылка устарела или пользователь удалён
                </p>
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Назад
                </Button>
              </div>
            )}

            {profileMode.type === "already_friends" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-positive/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-positive/60" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Вы уже друзья</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Этот пользователь уже в вашем списке друзей
                </p>
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Назад
                </Button>
              </div>
            )}

            {profileMode.type === "request_sent" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-primary/60" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Заявка отправлена</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Ожидайте, когда пользователь примет вашу заявку
                </p>
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Назад
                </Button>
              </div>
            )}

            {profileMode.type === "request_pending" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-amber-500/60" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Заявка от пользователя</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Этот пользователь уже отправил вам заявку. Проверьте вкладку «Друзья»
                </p>
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Назад
                </Button>
              </div>
            )}

            {profileMode.type === "auth_required" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <LogIn className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Войдите в аккаунт</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Чтобы добавить друзей, нужно авторизоваться
                </p>
                <Button onClick={() => navigate("/auth")}>
                  <LogIn className="w-4 h-4 mr-2" /> Войти
                </Button>
              </div>
            )}

            {profileMode.type === "addable" && (
              <div className="flex flex-col items-center py-12 text-center">
                {/* Large avatar */}
                <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 bg-muted ring-2 ring-primary/20 ring-offset-2 ring-offset-background mb-4">
                  {profileMode.profile.avatar ? (
                    <img
                      src={profileMode.profile.avatar}
                      alt={profileMode.profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={cn(
                      "w-full h-full flex items-center justify-center text-2xl font-bold text-white",
                      getAvatarColor(profileMode.profile.name)
                    )}>
                      {getInitials(profileMode.profile.name)}
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold">{profileMode.profile.name}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  @{profileMode.profile.username}
                </p>

                {!user ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Войдите в аккаунт, чтобы добавить в друзья
                    </p>
                    <Button onClick={() => navigate("/auth")}>
                      <LogIn className="w-4 h-4 mr-2" /> Войти
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="gap-1.5"
                    onClick={() => handleSendRequest(profileMode.profile.id)}
                  >
                    <UserPlus className="w-4 h-4" /> Добавить в друзья
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* ── SEARCH MODE (no target user) ── */}
        {!targetUserId && (
          <>
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
                  {results.map((u) => {
                    const isSent = successMap[u.id];
                    return (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 transition-colors"
                      >
                        {/* Avatar + Info — clickable to profile */}
                        <button
                          onClick={() => navigateToProfile(u.id)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-muted ring-1 ring-primary/10 hover:ring-2 hover:ring-primary/30 transition-all">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className={cn(
                                "w-full h-full flex items-center justify-center text-sm font-bold text-white",
                                getAvatarColor(u.name)
                              )}>
                                {getInitials(u.name)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                          </div>
                        </button>

                        {/* Action */}
                        {isSent ? (
                          <div className="flex items-center gap-1 text-xs text-positive font-semibold shrink-0">
                            <CheckCircle2 className="w-4 h-4" /> Отправлено
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="h-9 gap-1.5 text-xs shrink-0 rounded-xl"
                            onClick={() => handleSendRequest(u.id)}
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
          </>
        )}
      </div>
    </div>
  );
}
