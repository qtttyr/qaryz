import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFriendStore } from "@/stores/friendStore";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";
import { useFriendAnalytics } from "@/hooks/useFriendAnalytics";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { formatCurrency, getInitials, getAvatarColor } from "@/lib/formatters";
import {
  ArrowLeft, Plus, Send, LogIn, AlertTriangle,
  BarChart3, Heart, Target, Clock,
} from "lucide-react";
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NudgeButton from "@/components/debts/NudgeButton";

// ── Mini stat bar ──
function MiniStat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="text-center flex-1">
      <p className={cn(
        "text-lg font-bold tabular-nums",
        accent === "positive" && "text-positive",
        accent === "negative" && "text-negative",
        accent === "primary" && "text-primary",
      )}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

// ── Detail stat card ──
function DetailStat({
  label, value, icon, accent = "primary", index = 0,
}: {
  label: string; value: string | number; icon: React.ReactNode;
  accent?: "positive" | "negative" | "primary" | "muted"; index?: number;
}) {
  const accentStyles = {
    positive: "bg-positive/10 text-positive",
    negative: "bg-negative/10 text-negative",
    primary: "bg-primary/10 text-primary",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl bg-card border border-border/50 p-4 flex items-start gap-3"
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", accentStyles[accent])}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold text-foreground tabular-nums mt-0.5 truncate">{value}</p>
      </div>
    </motion.div>
  );
}

// ── Timeline entry ──
function TimelineEntry({ debt, analytics }: {
  debt: { id: string; amount: number; direction: string; description?: string; createdAt: string; settledAt?: string };
  analytics: { payments: { id: string; debtId: string; amount: number; type: string; createdAt: string }[] };
}) {
  const isSettled = !!debt.settledAt;
  const paid = analytics.payments
    .filter((p) => p.debtId === debt.id)
    .reduce((s, p) => s + p.amount, 0);
  const remaining = debt.amount - paid;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "relative flex items-start gap-3 p-3 rounded-xl transition-colors",
        isSettled
          ? "bg-muted/20"
          : debt.direction === "owed_to_me"
          ? "bg-positive/5"
          : "bg-negative/5"
      )}
    >
      {/* Direction dot */}
      <div className={cn(
        "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ring-2 ring-background",
        isSettled ? "bg-muted-foreground/30" :
        debt.direction === "owed_to_me" ? "bg-positive" : "bg-negative"
      )} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">
            {debt.description || (debt.direction === "owed_to_me" ? "Дал в долг" : "Взял в долг")}
          </p>
          <span className={cn(
            "text-sm font-semibold tabular-nums shrink-0",
            isSettled ? "text-muted-foreground line-through" :
            debt.direction === "owed_to_me" ? "text-positive" : "text-negative"
          )}>
            {debt.direction === "owed_to_me" ? "+" : "−"}{debt.amount.toLocaleString()} ₸
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">
            {new Date(debt.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {isSettled && (
            <span className="text-[10px] text-muted-foreground/50">• Закрыт</span>
          )}
          {!isSettled && paid > 0 && (
            <span className="text-[10px] text-muted-foreground/50">
              • Выплачено {paid.toLocaleString()} ₸
            </span>
          )}
          {!isSettled && remaining > 0 && (
            <span className="text-[10px] text-muted-foreground/50">
              • Осталось {remaining.toLocaleString()} ₸
            </span>
          )}
        </div>

        {/* Payment mini-timeline */}
        {analytics.payments.filter((p) => p.debtId === debt.id).length > 0 && (
          <div className="mt-1.5 space-y-0.5 pl-2 border-l-2 border-border/30">
            {analytics.payments.filter((p) => p.debtId === debt.id).map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span>
                  {p.type === "full" ? "Полное погашение" : "Частичная оплата"} —
                  {p.amount.toLocaleString()} ₸
                </span>
                <span className="text-muted-foreground/40">
                  {new Date(p.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function FriendProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const friends = useFriendStore((s) => s.friends);
  const removeFriend = useFriendStore((s) => s.removeFriend);
  const analytics = useFriendAnalytics(id);
  const currency = useUserStore((s) => s.profile.currency);

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
  const isFriend = !!friend;

  // ── Guard: no user ──
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <LogIn className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Войдите в аккаунт</h2>
        <Button onClick={() => navigate("/auth")}>Войти</Button>
      </div>
    );
  }

  // ── Guard: loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ── Guard: not found ──
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

  const hasData = analytics.totalDebts > 0;
  const chartHasData = analytics.monthlyActivity.some((m) => m.created > 0 || m.settled > 0);

  return (
    <div className="flex flex-col h-full">
      {/* ═══ Header ═══ */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center px-4 h-12 gap-3">
          <button onClick={goBack} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">Профиль</span>
        </div>
      </div>

      {/* ═══ Scrollable Content ═══ */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Profile Header ── */}
        <div className="px-4 pt-6 pb-4 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-muted ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className={cn(
                "w-full h-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br",
                getAvatarColor(profile.name)
              )}>
                {getInitials(profile.name)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.phone && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">{profile.phone}</p>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="px-4 mb-4 flex gap-2">
          <NudgeButton personId={id!} personName={profile.name} variant="button" />
          {isFriend && (
            <Button
              variant="outline"
              className="gap-1.5 h-12 px-4 rounded-xl shrink-0"
              onClick={async () => {
                if (confirm(`Удалить ${profile.name} из друзей?`)) {
                  await removeFriend(friend!.id);
                  navigate("/friends");
                }
              }}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* ── Compact Achievement Badge ── */}
        {analytics.topAchievement && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 mb-4"
          >
            <div className={cn(
              "relative overflow-hidden rounded-2xl border px-4 py-3 flex items-center gap-3",
              "bg-gradient-to-r",
              analytics.topAchievement.rarity === "legendary" ? "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/30" :
              analytics.topAchievement.rarity === "epic" ? "from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20 border-violet-200/50 dark:border-violet-800/30" :
              analytics.topAchievement.rarity === "rare" ? "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50 dark:border-blue-800/30" :
              "from-zinc-50 to-zinc-100 dark:from-zinc-900/20 dark:to-zinc-800/20 border-zinc-200/50 dark:border-zinc-800/30"
            )}>
              {/* Glow dot */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-gradient-to-br",
                analytics.topAchievement.rarity === "legendary" ? "from-amber-400 to-orange-400" :
                analytics.topAchievement.rarity === "epic" ? "from-violet-400 to-fuchsia-400" :
                analytics.topAchievement.rarity === "rare" ? "from-blue-400 to-cyan-400" :
                "from-zinc-300 to-zinc-400"
              )}>
                {analytics.topAchievement.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                  {analytics.topAchievement.title}
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider",
                    analytics.topAchievement.rarity === "legendary" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                    analytics.topAchievement.rarity === "epic" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" :
                    analytics.topAchievement.rarity === "rare" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {analytics.topAchievement.rarity === "legendary" ? "LEG" :
                     analytics.topAchievement.rarity === "epic" ? "EPIC" :
                     analytics.topAchievement.rarity === "rare" ? "RARE" : ""}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {analytics.topAchievement.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {!hasData ? (
          /* ── Empty State ── */
          <div className="px-4">
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-card border border-border/50">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <p className="text-base font-semibold mb-1">Никаких долгов</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                Пока нет ни одной записи. Начните с добавления первого долга
              </p>
              <Button onClick={() => navigate(`/person/${id}`)}>
                <Plus className="w-4 h-4 mr-1.5" /> Создать долг
              </Button>
            </div>

          </div>
        ) : (
          /* ═══ Full Analytics ═══ */
          <div className="px-4 space-y-5 pb-6">

            {/* ── Overview Card ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-5"
            >
              <div className={cn(
                "absolute top-0 left-0 right-0 h-0.5",
                analytics.balance >= 0
                  ? "bg-linear-to-r from-positive/80 to-positive/20"
                  : "bg-linear-to-r from-negative/80 to-negative/20"
              )} />

              <div className="text-center mb-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Текущий баланс
                </p>
                <p className={cn(
                  "text-3xl font-bold tabular-nums",
                  analytics.balance > 0 ? "text-positive" :
                  analytics.balance < 0 ? "text-negative" : "text-muted-foreground"
                )}>
                  {analytics.balance > 0 ? "+" : analytics.balance < 0 ? "−" : ""}
                  {formatCurrency(Math.abs(analytics.balance), currency)}
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 rounded-xl bg-positive/8 p-3.5 text-center">
                  <p className="text-[11px] text-muted-foreground mb-0.5">Он должен</p>
                  <p className="text-base font-bold text-positive tabular-nums">
                    {analytics.owedToMeCount} долг{analytics.owedToMeCount !== 1 ? "ов" : ""}
                  </p>
                </div>
                <div className="flex-1 rounded-xl bg-negative/8 p-3.5 text-center">
                  <p className="text-[11px] text-muted-foreground mb-0.5">Я должен</p>
                  <p className="text-base font-bold text-negative tabular-nums">
                    {analytics.iOwCount} долг{analytics.iOwCount !== 1 ? "ов" : ""}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── Quick Stats Row ── */}
            <div className="flex justify-around py-3 px-2 rounded-2xl bg-card border border-border/50">
              <MiniStat label="Всего долгов" value={analytics.totalDebts} />
              <div className="w-px bg-border/50" />
              <MiniStat
                label="Активных"
                value={analytics.activeDebts}
                accent={analytics.activeDebts > 0 ? "negative" : "muted"}
              />
              <div className="w-px bg-border/50" />
              <MiniStat
                label="Закрыто"
                value={analytics.closedDebts}
                accent={analytics.closedDebts > 0 ? "positive" : "muted"}
              />
              <div className="w-px bg-border/50" />
              <MiniStat label="Выплачено" value={analytics.totalPaymentsCount} />
            </div>

            {/* ── Detail Stats Grid ── */}
            <div className="grid grid-cols-2 gap-3">
              <DetailStat
                label="Средний долг"
                value={formatCurrency(analytics.averageDebt, currency)}
                icon={<BarChart3 className="w-4 h-4" />}
                accent="primary"
                index={0}
              />
              <DetailStat
                label="Общая сумма"
                value={formatCurrency(analytics.totalAllTime, currency)}
                icon={<Target className="w-4 h-4" />}
                accent="primary"
                index={1}
              />
              {analytics.biggestDebt && (
                <DetailStat
                  label="Самый большой"
                  value={formatCurrency(analytics.biggestDebt.amount, currency)}
                  icon={<Heart className="w-4 h-4" />}
                  accent="negative"
                  index={2}
                />
              )}
              {analytics.smallestActiveDebt ? (
                <DetailStat
                  label="Мин. активный"
                  value={formatCurrency(analytics.smallestActiveDebt.amount, currency)}
                  icon={<Clock className="w-4 h-4" />}
                  accent="muted"
                  index={3}
                />
              ) : analytics.closedDebts > 0 ? (
                <DetailStat
                  label="Закрыто на сумму"
                  value={formatCurrency(analytics.totalClosedAmount, currency)}
                  icon={<Clock className="w-4 h-4" />}
                  accent="positive"
                  index={3}
                />
              ) : null}
            </div>

            {/* ── Monthly Activity Chart ── */}
            {chartHasData && (
              <Card className="rounded-2xl border-border/50 bg-card overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Активность за 6 месяцев
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[180px] px-2 pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.monthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <YAxis axisLine={false} tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                        contentStyle={{
                          backgroundColor: "var(--card)", borderColor: "var(--border)",
                          borderRadius: "12px", fontSize: "12px",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                        itemStyle={{ padding: "2px 0" }}
                      />
                      <Bar dataKey="created" name="Новые" radius={[4, 4, 0, 0]} barSize={14}>
                        {analytics.monthlyActivity.map((_, i) => (
                          <Cell key={`c-${i}`} fill="var(--primary)" fillOpacity={0.8} />
                        ))}
                      </Bar>
                      <Bar dataKey="settled" name="Закрытые" radius={[4, 4, 0, 0]} barSize={14}>
                        {analytics.monthlyActivity.map((_, i) => (
                          <Cell key={`s-${i}`} fill="var(--positive)" fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* ── Transaction History ── */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                История операций
                <span className="text-[10px] font-normal ml-1.5 text-muted-foreground/60">
                  {analytics.totalDebts} записей
                </span>
              </h3>

              {analytics.debts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl bg-card border border-border/50">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm text-muted-foreground">Нет долгов с этим человеком</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {analytics.debts.slice(0, 50).map((debt) => (
                    <TimelineEntry
                      key={debt.id}
                      debt={debt}
                      analytics={analytics}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
