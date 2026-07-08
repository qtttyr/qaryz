import { useState } from "react";
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
import { ArrowLeft, Plus, Share2, LogIn } from "lucide-react";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isMobile = useIsMobile();
  const getShares = useGroupStore((s) => s.getShares);

  const { group, members, expenses, balances, total } = useGroupDetail(id || "");

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  if (!group || !id) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Группа не найдена</h2>
        <Button variant="outline" onClick={() => navigate("/groups")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад к группам
        </Button>
      </div>
    );
  }

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

  const Container = isMobile ? Sheet : Dialog;
  const ContainerContent = isMobile ? SheetContent : DialogContent;
  const ContainerHeader = isMobile ? SheetHeader : DialogHeader;
  const ContainerTitle = isMobile ? SheetTitle : DialogTitle;

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
          <button onClick={() => navigate("/groups")} className="p-1 -ml-1">
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
          <div className={cn(
            "rounded-2xl p-4",
            currentUserBalance > 0
              ? "bg-emerald-50 dark:bg-emerald-950/30"
              : currentUserBalance < 0
              ? "bg-red-50 dark:bg-red-950/30"
              : "bg-muted"
          )}>
            <p className="text-sm text-muted-foreground">Ваш баланс</p>
            <p className={cn(
              "text-2xl font-bold mt-0.5",
              currentUserBalance > 0 && "text-emerald-600 dark:text-emerald-400",
              currentUserBalance < 0 && "text-red-600 dark:text-red-400"
            )}>
              {currentUserBalance > 0 ? "+" : ""}{currentUserBalance.toLocaleString()} ₸
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Всего расходов: {total.toLocaleString()} ₸
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
                    {m.nickname || m.name?.split(" ")[0] || "User"}
                  </span>
                  {bal && bal.balance !== 0 && (
                    <span className={cn(
                      "text-[10px] font-semibold",
                      bal.balance > 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {bal.balance > 0 ? "+" : ""}{bal.balance.toLocaleString()}
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

      {/* FAB — Add Expense */}
      <div className="p-4 border-t bg-background">
        <Button className="w-full" onClick={() => setShowAddExpense(true)}>
          <Plus className="w-4 h-4 mr-2" /> Добавить расход
        </Button>
      </div>

      {/* Add Expense Sheet/Dialog */}
      {showAddExpense && (
        <Container open={showAddExpense} onOpenChange={setShowAddExpense}>
          <ContainerContent className={cn(isMobile ? "h-full" : "sm:max-w-md")}>
            {isMobile ? (
              <>
                <SheetHeader>
                  <SheetTitle>Новый расход</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto flex-1">
                  <ExpenseForm groupId={id!} onClose={() => setShowAddExpense(false)} />
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Новый расход</DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                  <ExpenseForm groupId={id!} onClose={() => setShowAddExpense(false)} />
                </div>
              </>
            )}
          </ContainerContent>
        </Container>
      )}

      {/* Invite Sheet/Dialog */}
      {showInvite && (
        <Container open={showInvite} onOpenChange={setShowInvite}>
          <ContainerContent className={cn(isMobile ? "" : "sm:max-w-sm")}>
            <ContainerHeader>
              <ContainerTitle>Пригласить</ContainerTitle>
            </ContainerHeader>
            <InviteSheet
              groupId={id}
              inviteCode={group.inviteCode}
              groupName={group.name}
            />
          </ContainerContent>
        </Container>
      )}
    </div>
  );
}
