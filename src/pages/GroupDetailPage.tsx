import { Component, useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroupDetail } from "@/hooks/useGroups";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { MemberAvatar } from "@/components/groups/MemberAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCategoryEmoji, getCategoryLabel } from "@/types/group";
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from "@/components/ui/message";
import {
  Bubble,
  BubbleContent,
} from "@/components/ui/bubble";
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
import PullToRefresh from "@/components/layout/PullToRefresh";
import {
  ArrowLeft,
  Plus,
  Info,
  ChevronDown,
  LogIn,
  AlertTriangle,
  Trash2,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Expense, ExpenseShare } from "@/types/group";

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

// ─── Date formatting ──────────────────────────────────────

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const d = date.toDateString();
  const t = today.toDateString();
  const y = yesterday.toDateString();

  if (d === t) return "Сегодня";
  if (d === y) return "Вчера";

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

// ─── Expense → WhatsApp-style message bubbles ─────────────

function buildExpenseBubbles(
  expenses: Expense[],
  getShares: (expenseId: string) => (ExpenseShare & { name?: string })[],
  memberNameMap: Record<string, string>,
  currentUserId: string,
  onExpenseClick: (expense: Expense, shares: (ExpenseShare & { name?: string })[]) => void
): { date: string; items: React.ReactNode[] }[] {
  // Step 1: group expenses by date
  const dateGroups: { date: string; dateLabel: string; expenses: Expense[] }[] = [];
  for (const expense of expenses) {
    const expenseDate = new Date(expense.createdAt).toDateString();
    const last = dateGroups[dateGroups.length - 1];
    if (last && last.date === expenseDate) {
      last.expenses.push(expense);
    } else {
      dateGroups.push({
        date: expenseDate,
        dateLabel: formatDateSeparator(expenseDate),
        expenses: [expense],
      });
    }
  }

  // Step 2: build React nodes per date group
  return dateGroups.map((dg) => {
    const shareCache = new Map<string, (ExpenseShare & { name?: string })[]>();

    const expenseNodes = dg.expenses.map((expense) => {
      // Cache shares per expense
      if (!shareCache.has(expense.id)) {
        shareCache.set(
          expense.id,
          getShares(expense.id).map((s) => ({
            ...s,
            name: memberNameMap[s.userId] || "Пользователь",
          }))
        );
      }
      const expenseShares = shareCache.get(expense.id)!;
      const isMine = expense.paidBy === currentUserId;
      const canDelete = isMine;

      const bubbleContent = (
        <MessageGroup>
          <Message align={isMine ? "end" : "start"}>
            {!isMine && (
              <div className="flex w-fit min-w-8 shrink-0 items-center self-end overflow-hidden rounded-full bg-muted">
                <MemberAvatar
                  name={memberNameMap[expense.paidBy] || "?"}
                  size="sm"
                />
              </div>
            )}
            <MessageContent>
              <Bubble
                variant={isMine ? "default" : "secondary"}
                align={isMine ? "end" : "start"}
              >
                <BubbleContent className="space-y-1.5">
                  {/* Amount row */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryEmoji(expense.category)}</span>
                    <span className="text-lg font-bold tabular-nums">
                      {expense.amount.toLocaleString()} ₸
                    </span>
                  </div>

                  {/* Description */}
                  {expense.description && (
                    <p className="text-sm leading-snug opacity-80">
                      {expense.description}
                    </p>
                  )}

                  {/* Who paid */}
                  <p className="text-[11px] font-medium opacity-60">
                    {isMine ? "Я заплатил(а)" : `${memberNameMap[expense.paidBy] || "Пользователь"} заплатил(а)`}
                  </p>

                  {/* Shares */}
                  {expenseShares.length > 0 && (
                    <div className={cn(
                      "flex flex-wrap gap-1 pt-1.5 border-t",
                      isMine ? "border-primary-foreground/20" : "border-border/30"
                    )}>
                      {expenseShares.map((s) => (
                        <span
                          key={s.id}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                            isMine
                              ? "bg-primary-foreground/10 text-primary-foreground/80"
                              : "bg-background/50 text-muted-foreground dark:bg-background/30"
                          )}
                        >
                          {s.name}: {s.shareAmount.toLocaleString()} ₸
                        </span>
                      ))}
                    </div>
                  )}
                </BubbleContent>
              </Bubble>

              {/* Time */}
              <MessageFooter>
                {new Date(expense.createdAt).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </MessageFooter>
            </MessageContent>
          </Message>
        </MessageGroup>
      );

      return (
        <div
          key={expense.id}
          onClick={canDelete ? () => onExpenseClick(expense, expenseShares) : undefined}
          className={cn(canDelete && "cursor-pointer active:scale-[0.98] transition-transform duration-100")}
        >
          {bubbleContent}
        </div>
      );
    });

    return {
      date: dg.date,
      items: [
        // Date separator (once per date group, at the top)
        <div key={`sep-${dg.date}`} className="flex justify-center my-2">
          <Bubble variant="ghost">
            <BubbleContent className="text-center !p-1">
              <span className="text-xs text-muted-foreground/60">{dg.dateLabel}</span>
            </BubbleContent>
          </Bubble>
        </div>,
        // All expenses for this date
        ...expenseNodes,
      ],
    };
  });
}

// ─── Scroll to bottom button ──────────────────────────────

function ScrollToBottom({ onClick, visible }: { onClick: () => void; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={onClick}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center z-10 hover:bg-accent transition-colors"
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════

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

// ─── Main Content (WhatsApp-style chat) ────────────────────

function GroupDetailContent({ groupId }: { groupId: string }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const getShares = useGroupStore((s) => s.getShares);
  const deleteExpense = useGroupStore((s) => s.deleteExpense);
  const syncFromSupabase = useGroupStore((s) => s.syncFromSupabase);
  const isMobile = useIsMobile();

  const { group, members, expenses, balances, total } = useGroupDetail(groupId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const goBack = () => navigate("/groups");

  // Auto-scroll to bottom on new expense
  useEffect(() => {
    if (scrollRef.current && !isScrolledUp) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [expenses.length, isScrolledUp]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setIsScrolledUp(!isNearBottom);
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  // ── Guards ──
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Войдите в аккаунт</h2>
        <p className="text-muted-foreground mb-4">Чтобы просматривать расходы группы</p>
        <Button onClick={() => navigate("/auth")}>
          <LogIn className="w-4 h-4 mr-2" /> Войти
        </Button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Группа не найдена</h2>
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад к группам
        </Button>
      </div>
    );
  }

  // Map user names to shares
  const memberNameMap = Object.fromEntries(
    members.map((m) => [m.userId, m.nickname || m.name || "Пользователь"])
  );

  // Build message bubbles
  const messageGroups = buildExpenseBubbles(
    expenses,
    getShares,
    memberNameMap,
    user.id,
    (expense) => setSelectedExpense(expense)
  );

  return (
    <PullToRefresh onRefresh={syncFromSupabase} className="flex flex-col flex-1 min-h-0 bg-background">
      {/* ═══ Header ═══ */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/30">
        <div className="flex items-center px-4 h-14 gap-3">
          <button onClick={goBack} className="p-1.5 -ml-1.5 rounded-xl hover:bg-muted/60 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden text-lg">
              {group.photo ? (
                <img src={group.photo} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                group.emoji
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm truncate">{group.name}</h1>
              <p className="text-[11px] text-muted-foreground/60 truncate">
                {members.length}{" "}
                {members.length === 1 ? "участник" : members.length < 5 ? "участника" : "участников"}
                {total > 0 && ` · ${total.toLocaleString()} ₸`}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/groups/${groupId}/info`)}
            className="p-2 rounded-xl hover:bg-muted/60 transition-colors"
          >
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* ═══ Chat Area ═══ */}
      <div className="flex-1 relative min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto px-3 py-2"
        >
          {expenses.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4 text-3xl overflow-hidden">
                {group.photo ? (
                  <img src={group.photo} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  group.emoji
                )}
              </div>
              <h2 className="text-base font-semibold mb-1">{group.name}</h2>
              <p className="text-sm text-muted-foreground/70 max-w-xs mb-6">
                Напишите первый расход, чтобы начать
              </p>

              {/* Member avatars */}
              {members.length > 0 && (
                <div className="flex -space-x-2 mb-4">
                  {members.slice(0, 6).map((m) => (
                    <div key={m.id} className="ring-2 ring-background rounded-full">
                      <MemberAvatar
                        name={m.nickname || m.name || "?"}
                        size="sm"
                      />
                    </div>
                  ))}
                  {members.length > 6 && (
                    <div className="w-6 h-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                      +{members.length - 6}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── Chat messages ── */
            <div className="space-y-1 pb-2">
              {messageGroups.map((group) => group.items)}

              {/* ── Balance summary at bottom ── */}
              {balances.filter((b) => b.balance !== 0).length > 0 && (
                <div className="pt-4 space-y-1">
                  <div className="flex justify-center">
                    <Bubble variant="ghost">
                      <BubbleContent className="text-center !p-1">
                        <span className="text-xs font-medium text-muted-foreground/70">
                          💰 Итого: {total.toLocaleString()} ₸
                        </span>
                      </BubbleContent>
                    </Bubble>
                  </div>
                  {balances
                    .filter((b) => b.balance !== 0)
                    .slice(0, 3)
                    .map((b) => (
                      <div key={b.userId} className="flex justify-center">
                        <Bubble variant="ghost">
                          <BubbleContent className="!p-1">
                            <span className={cn(
                              "text-xs font-medium",
                              b.balance > 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                              {b.name}: {b.balance > 0 ? "+" : ""}
                              {b.balance.toLocaleString()} ₸
                            </span>
                          </BubbleContent>
                        </Bubble>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        <ScrollToBottom onClick={scrollToBottom} visible={isScrolledUp && expenses.length > 0} />
      </div>

      {/* ═══ Bottom bar — WhatsApp-style text input area ═══ */}
      <div className="px-3 py-2.5 border-t border-border/20 bg-background/95 backdrop-blur-xl">
        <button
          onClick={() => navigate(`/groups/${groupId}/add-expense`)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/40 border border-border/30 hover:bg-muted/60 hover:border-border/50 active:scale-[0.99] transition-all duration-150 text-left"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground/70 flex-1">
            Добавить расход...
          </span>
          {total > 0 && (
            <span className="text-xs font-semibold text-foreground/50 tabular-nums tracking-tight">
              {total.toLocaleString()} ₸
            </span>
          )}
        </button>
      </div>

      {/* ═══ Expense action sheet / dialog ═══ */}
      {selectedExpense && (() => {
        const expenseShares = getShares(selectedExpense.id).map((s) => ({
          ...s,
          name: memberNameMap[s.userId] || "Пользователь",
        }));
        const isMine = selectedExpense.paidBy === user.id;
        const paidByName = memberNameMap[selectedExpense.paidBy] || "Пользователь";
        const timeStr = new Date(selectedExpense.createdAt).toLocaleString("ru-RU", {
          hour: "2-digit", minute: "2-digit",
          day: "numeric", month: "long",
        });

        const modalContent = (
          <div className="space-y-5">
            {/* Expense preview */}
            <div className="flex items-center gap-4 px-1">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl shrink-0">
                {getCategoryEmoji(selectedExpense.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold tabular-nums">
                  {selectedExpense.amount.toLocaleString()} ₸
                </div>
                {selectedExpense.description && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {selectedExpense.description}
                  </p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 bg-muted/30 rounded-2xl px-4 py-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Категория</span>
                <span className="font-medium">{getCategoryLabel(selectedExpense.category)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Кто заплатил</span>
                <span className="font-medium">{paidByName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Время</span>
                <span className="font-medium text-xs">{timeStr}</span>
              </div>
              <div className="border-t border-border/20 pt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Users className="w-4 h-4" />
                  <span>Разделено на {expenseShares.length} человек</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {expenseShares.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground"
                    >
                      {s.name}: {s.shareAmount.toLocaleString()} ₸
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Delete button — only shown for own expenses */}
            {isMine && (
              <button
                onClick={async () => {
                  if (deleting) return;
                  setDeleting(true);
                  try {
                    await deleteExpense(selectedExpense.id);
                    setSelectedExpense(null);
                  } catch (e) {
                    console.error("Failed to delete:", e);
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-destructive/10 text-destructive font-medium text-sm hover:bg-destructive/15 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Удаление..." : "Удалить расход"}
              </button>
            )}
          </div>
        );

        return isMobile ? (
          <Sheet open={!!selectedExpense} onOpenChange={(o) => { if (!o) setSelectedExpense(null); }}>
            <SheetContent side="bottom" className="rounded-t-3xl px-5 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
              <SheetHeader className="mb-5">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-3" />
                <SheetTitle className="text-left text-base">Детали расхода</SheetTitle>
              </SheetHeader>
              {modalContent}
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={!!selectedExpense} onOpenChange={(o) => { if (!o) setSelectedExpense(null); }}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Детали расхода</DialogTitle>
              </DialogHeader>
              {modalContent}
            </DialogContent>
          </Dialog>
        );
      })()}
    </PullToRefresh>
  );
}
