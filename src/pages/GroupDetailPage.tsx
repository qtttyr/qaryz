import { Component, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroupDetail } from "@/hooks/useGroups";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { ExpenseCard } from "@/components/groups/ExpenseCard";
import { ExpenseForm } from "@/components/groups/ExpenseForm";
import { MemberAvatar } from "@/components/groups/MemberAvatar";
import { InviteSheet } from "@/components/groups/InviteSheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, Plus, Share2, LogIn, AlertTriangle } from "lucide-react";

// ─── Error Boundary ───────────────────────────────────────

class GroupErrorBoundary extends Component<
  { children: React.ReactNode; onBack: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onBack: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive/60 mb-4" />
          <h2 className="text-lg font-semibold mb-1">Что-то пошло не так</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Не удалось загрузить данные группы
          </p>
          <Button variant="outline" onClick={this.props.onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Page Component ───────────────────────────────────────

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = () => navigate("/groups");

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Группа не найдена</h2>
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад к группам
        </Button>
      </div>
    );
  }

  return (
    <GroupErrorBoundary onBack={goBack}>
      <GroupDetailContent groupId={id} />
    </GroupErrorBoundary>
  );
}

// ─── Main Content ─────────────────────────────────────────

function GroupDetailContent({ groupId }: { groupId: string }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isMobile = useIsMobile();
  const getShares = useGroupStore((s) => s.getShares);

  const { group, members, expenses, balances, total } = useGroupDetail(groupId);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const goBack = () => navigate("/groups");

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Войдите в аккаунт</h2>
        <p className="text-muted-foreground mb-4">Чтобы просматривать расходы группы</p>
        <Button onClick={() => navigate("/login")}>
          <LogIn className="w-4 h-4 mr-2" /> Войти
        </Button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Группа не найдена</h2>
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад к группам
        </Button>
      </div>
    );
  }

  const currentUserBalance = balances.find((b) => b.userId === user.id)?.balance || 0;

  // Map user names to shares
  const memberNameMap = Object.fromEntries(
    members.map((m) => [m.userId, m.nickname || m.name || "Пользователь"])
  );

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center px-4 h-12 gap-3">
          <button onClick={goBack} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xl">{group.emoji}</span>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base truncate">{group.name}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowInvite(true)}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Balance Summary */}
        <div className="px-4 py-4">
          <div
            className={cn(
              "rounded-2xl p-4",
              currentUserBalance > 0
                ? "bg-emerald-50 dark:bg-emerald-950/30"
                : currentUserBalance < 0
                ? "bg-red-50 dark:bg-red-950/30"
                : "bg-muted"
            )}
          >
            <p className="text-sm text-muted-foreground">Ваш баланс</p>
            <p
              className={cn(
                "text-2xl font-bold mt-0.5",
                currentUserBalance > 0 && "text-emerald-600 dark:text-emerald-400",
                currentUserBalance < 0 && "text-red-600 dark:text-red-400"
              )}
            >
              {currentUserBalance > 0 ? "+" : ""}
              {isFinite(currentUserBalance) ? currentUserBalance.toLocaleString() : "0"} ₸
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Всего расходов: {isFinite(total) ? total.toLocaleString() : "0"} ₸
            </p>
          </div>
        </div>

        {/* Member avatars */}
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
            Участники ({members.length})
          </p>
          <div className="flex gap-3 flex-wrap">
            {members.map((m) => {
              const bal = balances.find((b) => b.userId === m.userId);
              return (
                <div key={m.id} className="flex flex-col items-center gap-1">
                  <MemberAvatar
                    name={m.nickname || m.name || "?"}
                    size="lg"
                  />
                  <span className="text-[10px] text-muted-foreground truncate max-w-16 text-center">
                    {m.nickname || (m.name ? m.name.split(" ")[0] : "User")}
                  </span>
                  {bal && bal.balance !== 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold",
                        bal.balance > 0 ? "text-emerald-500" : "text-red-500"
                      )}
                    >
                      {bal.balance > 0 ? "+" : ""}
                      {isFinite(bal.balance) ? bal.balance.toLocaleString() : "0"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Expense Feed */}
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
            Расходы
          </p>

          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">Нет расходов</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Добавьте первый расход в группе
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => {
                const shares = getShares(e.id).map((s) => ({
                  ...s,
                  name: memberNameMap[s.userId] || "Пользователь",
                }));
                const paidByName = memberNameMap[e.paidBy];
                return (
                  <ExpenseCard
                    key={e.id}
                    expense={e}
                    shares={shares}
                    paidByName={paidByName}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Add Button */}
      <div className="p-4 border-t bg-background">
        <Button className="w-full" onClick={() => setShowAddExpense(true)}>
          <Plus className="w-4 h-4 mr-2" /> Добавить расход
        </Button>
      </div>

      {/* Add Expense — Sheet on mobile, Dialog on desktop */}
      {showAddExpense &&
        (isMobile ? (
          <Sheet open={showAddExpense} onOpenChange={setShowAddExpense}>
            <SheetContent className="h-full flex flex-col">
              <SheetHeader>
                <SheetTitle>Новый расход</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto mt-4">
                <ExpenseForm groupId={groupId} onClose={() => setShowAddExpense(false)} />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Новый расход</DialogTitle>
              </DialogHeader>
              <ExpenseForm groupId={groupId} onClose={() => setShowAddExpense(false)} />
            </DialogContent>
          </Dialog>
        ))}

      {/* Invite — Sheet on mobile, Dialog on desktop */}
      {showInvite &&
        (isMobile ? (
          <Sheet open={showInvite} onOpenChange={setShowInvite}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Пригласить</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <InviteSheet
                  groupId={groupId}
                  inviteCode={group.inviteCode}
                  groupName={group.name}
                />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Пригласить</DialogTitle>
              </DialogHeader>
              <InviteSheet
                groupId={groupId}
                inviteCode={group.inviteCode}
                groupName={group.name}
              />
            </DialogContent>
          </Dialog>
        ))}
    </div>
  );
}
