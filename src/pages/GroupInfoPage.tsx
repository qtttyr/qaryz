import { useParams, useNavigate } from "react-router-dom";
import { useGroupDetail } from "@/hooks/useGroups";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { createGroupSettlementDebts } from "@/lib/groupSettlementToDebt";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { MemberAvatar } from "@/components/groups/MemberAvatar";
import { GroupSettlementSummary } from "@/components/groups/GroupSettlementSummary";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/shared/Toast";
import { ArrowLeft, LogIn, ArrowRightFromLine } from "lucide-react";
import { motion } from "framer-motion";

export default function GroupInfoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const syncFromSupabase = useGroupStore((s) => s.syncFromSupabase);
  const settleAllExpenses = useGroupStore((s) => s.settleAllExpenses);
  const leaveGroup = useGroupStore((s) => s.leaveGroup);

  const { group, members, expenses, balances, total, activeTotal, settledCount, activeCount } = useGroupDetail(id || "");

  if (!id || !group) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
        <h2 className="text-xl font-semibold">Группа не найдена</h2>
        <Button variant="outline" onClick={() => navigate("/groups")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
        <h2 className="text-xl font-semibold">Войдите в аккаунт</h2>
        <Button onClick={() => navigate("/auth")}>
          <LogIn className="w-4 h-4 mr-2" /> Войти
        </Button>
      </div>
    );
  }

  const handleSettleAll = async () => {
    try {
      await settleAllExpenses(id, user.id);

      // После закрытия — перенести балансы в личные долги
      try {
        const created = await createGroupSettlementDebts(id, group.name);
        if (created) {
          showToast("🎉 Счёт закрыт! Долги добавлены в личный раздел.", "success");
        } else {
          showToast("🎉 Все расходы закрыты! Счёт погашен.", "success");
        }
      } catch {
        // Даже если создание долгов упало, расходы уже закрыты
        showToast("🎉 Расходы закрыты. Долги будут добавлены при синхронизации.", "success");
      }
    } catch {
      showToast("Не удалось закрыть счёт", "error");
    }
  };

  const handleLeave = async () => {
    const isCreator = group.createdBy === user?.id;
    const message = isCreator
      ? "Вы создатель группы. Выход удалит группу для всех участников. Продолжить?"
      : "Вы уверены, что хотите выйти из группы?";
    if (confirm(message)) {
      await leaveGroup(id);
      navigate("/groups");
    }
  };

  const memberBalance = (userId: string) =>
    balances.find((b) => b.userId === userId);

  return (
    <PullToRefresh onRefresh={syncFromSupabase}>
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center px-4 h-12 gap-2">
          <button onClick={() => navigate(`/groups/${id}`)} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">Информация</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-8 pb-6">
          {/* ── Group header ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center pb-6 border-b border-border/20"
          >
            {/* Photo or initials */}
            {group.photo ? (
              <div className="w-20 h-20 rounded-full overflow-hidden mb-4 ring-2 ring-border/30">
                <img
                  src={group.photo}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl mb-4">
                {group.emoji}
              </div>
            )}
            <h2 className="text-xl font-bold">{group.name}</h2>
            {group.description && (
              <p className="text-sm text-muted-foreground/70 mt-1 text-center max-w-xs">
                {group.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground/50 mt-2">
              {members.length}{" "}
              {members.length === 1
                ? "участник"
                : members.length < 5
                  ? "участника"
                  : "участников"}
              {total > 0 && ` · ${total.toLocaleString()} ₸`}
            </p>
          </motion.div>

          {/* ── Members ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="pt-5"
          >
            <h3 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider mb-3">
              Участники
            </h3>
            <div className="space-y-0.5">
              {members.map((m, i) => {
                const bal = memberBalance(m.userId);
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.07 + i * 0.03 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    <MemberAvatar
                      name={m.nickname || m.name || "?"}
                      avatarUrl={m.avatarUrl}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.nickname || m.name || "Пользователь"}
                        {m.userId === user.id && (
                          <span className="text-muted-foreground/40 ml-1 text-xs font-normal">
                            (вы)
                          </span>
                        )}
                      </p>
                    </div>
                    {bal && (
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          bal.balance > 0 && "text-emerald-500",
                          bal.balance < 0 && "text-red-500",
                          bal.balance === 0 && "text-muted-foreground/40"
                        )}
                      >
                        {bal.balance > 0 ? "+" : ""}
                        {bal.balance.toLocaleString()} ₸
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Settlement Summary (чек-итог) ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="pt-5"
          >
            <GroupSettlementSummary
              balances={balances}
              activeTotal={activeTotal}
              activeCount={activeCount}
              settledCount={settledCount}
              currentUserId={user.id}
              onSettleAll={handleSettleAll}
            />
          </motion.div>

          {/* ── Stats ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="pt-5"
          >
            <h3 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider mb-3">
              Статистика
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-xl bg-muted/20 p-3 text-center border border-border/20">
                <p className="text-lg font-bold">{total.toLocaleString()} ₸</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Всего</p>
              </div>
              <div className="rounded-xl bg-muted/20 p-3 text-center border border-border/20">
                <p className="text-lg font-bold">{expenses.length}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Расходов</p>
              </div>
              <div className="rounded-xl bg-muted/20 p-3 text-center border border-border/20">
                <p className="text-lg font-bold">
                  {expenses.length > 0
                    ? Math.round(total / expenses.length).toLocaleString()
                    : "0"}{" "}
                  ₸
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Средний</p>
              </div>
              <div className="rounded-xl bg-muted/20 p-3 text-center border border-border/20">
                <p className="text-lg font-bold">{members.length}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Участников</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Leave button ── */}
      <div className="px-4 py-3 border-t bg-background/80 backdrop-blur-sm">
        <Button
          variant="outline"
          onClick={handleLeave}
          className="w-full h-11 rounded-2xl text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30 gap-2"
        >
          <ArrowRightFromLine className="w-4 h-4" />
          Выйти из группы
        </Button>
      </div>
    </div>
    </PullToRefresh>
  );
}
