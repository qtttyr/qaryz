import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFriendStore } from "@/stores/friendStore";
import { useAuthStore } from "@/stores/authStore";
import { useDebtStore } from "@/stores/debtStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/formatters";
import { ArrowLeft, Plus, Send, LogIn, AlertTriangle } from "lucide-react";

export default function FriendProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const friends = useFriendStore((s) => s.friends);
  const debts = useDebtStore((s) => s.debts);
  const payments = useDebtStore((s) => s.payments);
  const people = useDebtStore((s) => s.people);
  const removeFriend = useFriendStore((s) => s.removeFriend);

  const [profile, setProfile] = useState<{
    name: string; username: string; avatar?: string; phone?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // The friend object from store
  const friend = friends.find((f) => {
    const otherId = f.userId === user?.id ? f.friendId : f.userId;
    return otherId === id;
  });

  // Fetch full profile if not in store
  useEffect(() => {
    if (!id || !user) return;

    if (friend) {
      setProfile({
        name: friend.name || "Пользователь",
        username: friend.username || "user",
        avatar: friend.avatar,
        phone: friend.phone,
      });
      setLoading(false);
      return;
    }

    // Fetch from Supabase directly (for direct link access)
    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("name, username, avatar_url, phone")
          .eq("id", id)
          .single();
        if (data) {
          setProfile({
            name: data.name,
            username: data.username,
            avatar: data.avatar_url,
            phone: data.phone,
          });
        }
      } catch {
        // User not found
      }
      setLoading(false);
    };
    fetchProfile();
  }, [id, user, friend]);

  const goBack = () => navigate("/friends");

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <LogIn className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Войдите в аккаунт</h2>
        <Button onClick={() => navigate("/auth")}>Войти</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Пользователь не найден</h2>
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад
        </Button>
      </div>
    );
  }

  const isFriend = !!friend;

  // Calculate stats
  const personEntry = people.find((p) => p.id === id);
  const personDebts = personEntry
    ? debts.filter((d) => d.personId === personEntry.id)
    : [];
  const totalDebts = personDebts.length;
  const closedDebts = personDebts.filter((d) => d.settledAt).length;

  let balance = 0;
  for (const debt of personDebts) {
    if (debt.settledAt) continue;
    const paid = payments
      .filter((p) => p.debtId === debt.id)
      .reduce((sum, p) => sum + p.amount, 0);
    balance += debt.direction === "owed_to_me" ? (debt.amount - paid) : -(debt.amount - paid);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center px-4 h-12 gap-3">
          <button onClick={goBack} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">Профиль</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile header — Instagram style */}
        <div className="px-4 pt-6 pb-4 flex items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-muted ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className={cn(
                "w-full h-full flex items-center justify-center text-xl font-bold text-white",
                getAvatarColor(profile.name)
              )}>
                {getInitials(profile.name)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.phone && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">{profile.phone}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="mx-4 mb-4 flex justify-around py-3 px-2 rounded-2xl bg-card border border-border/50">
          <div className="text-center">
            <p className="text-lg font-bold">{totalDebts}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Долгов</p>
          </div>
          <div className="w-px bg-border/50" />
          <div className="text-center">
            <p className="text-lg font-bold">{closedDebts}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Закрыто</p>
          </div>
          <div className="w-px bg-border/50" />
          <div className="text-center">
            <p className={cn(
              "text-lg font-bold",
              balance > 0 ? "text-emerald-500" : balance < 0 ? "text-red-500" : ""
            )}>
              {balance > 0 ? "+" : ""}{balance.toLocaleString()} ₸
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Баланс</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 mb-4 flex gap-2">
          <Button className="flex-1 gap-1.5" onClick={() => navigate(`/person/${id}`)}>
            <Plus className="w-4 h-4" /> Добавить долг
          </Button>
          {isFriend && (
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={async () => {
                if (confirm(`Удалить ${profile.name} из друзей?`)) {
                  await removeFriend(friend!.id);
                  navigate("/friends");
                }
              }}
            >
              <Send className="w-4 h-4" /> Удалить
            </Button>
          )}
        </div>

        <Separator />

        {/* Debt history */}
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            История
          </p>

          {personDebts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">Нет долгов с этим человеком</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate(`/person/${id}`)}
                className="mt-1"
              >
                Создать первый долг
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {personDebts.slice(0, 20).map((debt) => (
                <div
                  key={debt.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl",
                    debt.settledAt
                      ? "bg-muted/30"
                      : debt.direction === "owed_to_me"
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "bg-red-50/50 dark:bg-red-950/20"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {debt.description || "Долг"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(debt.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={cn(
                      "text-sm font-semibold",
                      debt.settledAt
                        ? "text-muted-foreground line-through"
                        : debt.direction === "owed_to_me"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {debt.direction === "owed_to_me" ? "+" : "-"}
                      {debt.amount.toLocaleString()} ₸
                    </p>
                    {debt.settledAt && (
                      <p className="text-[10px] text-muted-foreground">Закрыт</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
