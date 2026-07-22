import { Component, useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import {
  ArrowLeft,
  Plus,
  Info,
  ChevronDown,
  LogIn,
  AlertTriangle,
  Trash2,
  Users,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "@/components/shared/Toast";
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
  onExpenseClick: (expense: Expense, shares: (ExpenseShare & { name?: string })[]) => void,
  onSettleExpense: (expenseId: string) => void,
  settlingId: string | null
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
      const isSettled = expense.settled;
      const isSettling = settlingId === expense.id;
      const canDelete = isMine && !isSettled;
      const canSettle = isMine && !isSettled;

      const bubbleContent = (
        <MessageGroup>
          <Message align={isMine ? "end" : "start"}>
            {!isMine && (
              <div className={cn(
                "flex w-fit min-w-8 shrink-0 items-center self-end overflow-hidden rounded-full",
                isSettled ? "opacity-50" : "bg-muted"
              )}>
                <MemberAvatar
                  name={memberNameMap[expense.paidBy] || "?"}
                  size="sm"
                />
              </div>
            )}
            <MessageContent>
              <Bubble
                variant={isMine
                  ? isSettled ? "secondary" : "default"
                  : "secondary"
                }
                align={isMine ? "end" : "start"}
              >
                <BubbleContent className={cn(
                  "space-y-1.5 transition-all duration-300",
                  isSettled && "opacity-55"
                )}>
                  {/* ── Amount row ── */}
                  <div className="flex items-center gap-2">
                    {isSettled && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <span className="text-lg">{getCategoryEmoji(expense.category)}</span>
                    <span className={cn(
                      "text-lg tabular-nums",
                      isSettled ? "font-semibold line-through decoration-muted-foreground/30" : "font-bold"
                    )}>
                      {expense.amount.toLocaleString()} ₸
                    </span>
                    {isSettled && (
                      <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        Закрыт
                      </span>
                    )}
                  </div>

                  {/* ── Description ── */}
                  {expense.description && (
                    <p className={cn(
                      "text-sm leading-snug",
                      isSettled ? "opacity-50" : "opacity-80"
                    )}>
                      {expense.description}
                    </p>
                  )}

                  {/* ── Who paid ── */}
                  {!isSettled && (
                    <p className="text-[11px] font-medium opacity-60">
                      {isMine ? "Я заплатил(а)" : `${memberNameMap[expense.paidBy] || "Пользователь"} заплатил(а)`}
                    </p>
                  )}

                  {/* ── Shares (только для активных) ── */}
                  {!isSettled && expenseShares.length > 0 && (
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

                  {/* ── Settled info (для закрытых) ── */}
                  {isSettled && (
                    <p className="text-[11px] font-medium text-emerald-500/70 pt-0.5">
                      ✅ Все скинулись
                      {expense.settledAt && (
                        <span className="text-muted-foreground/40 ml-1">
                          · {new Date(expense.settledAt).toLocaleTimeString("ru-RU", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      )}
                    </p>
                  )}

                  {/* ── Settle button (только для active + мой расход) ── */}
                  {canSettle && (
                    <div className="pt-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSettleExpense(expense.id);
                        }}
                        disabled={isSettling}
                        className={cn(
                          "w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150",
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
                          "active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                        )}
                      >
                        {isSettling ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                            Закрытие...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Все скинулись
                          </>
                        )}
                      </button>
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
          onClick={canDelete ? (e) => {
            // Не открывать детали при клике на кнопку settle
            if ((e.target as HTMLElement).closest('button')) return;
            onExpenseClick(expense, expenseShares);
          } : undefined}
          className={cn(
            canDelete && !isSettled && "cursor-pointer active:scale-[0.98] transition-transform duration-100"
          )}
        >
          <motion.div
            layout
            initial={isSettled ? { opacity: 0.7, scale: 0.98 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {bubbleContent}
          </motion.div>
        </div>
      );
    });

    return {
      date: dg.date,
      items: [
        <div key={`sep-${dg.date}`} className="flex justify-center my-2">
          <Bubble variant="ghost">
            <BubbleContent className="text-center !p-1">
              <span className="text-xs text-muted-foreground/60">{dg.dateLabel}</span>
            </BubbleContent>
          </Bubble>
        </div>,
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
  const settleExpense = useGroupStore((s) => s.settleExpense);
  const isMobile = useIsMobile();

  const { group, members, expenses, balances, total, activeTotal, settledCount, activeCount } = useGroupDetail(groupId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expenseFilter, setExpenseFilter] = useState<"all" | "active" | "settled">("all");
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const goBack = () => navigate("/groups");

  // ── Handle settle expense ──
  const handleSettleExpense = useCallback(async (expenseId: string) => {
    if (!user || settlingId) return;
    setSettlingId(expenseId);
    try {
      await settleExpense(expenseId, user.id);
      showToast("✅ Расход закрыт — все скинулись", "success");
    } catch {
      showToast("Не удалось закрыть расход", "error");
    } finally {
      setSettlingId(null);
    }
  }, [user, settlingId, settleExpense]);

  // ── Filter expenses ──
  const filteredExpenses = useMemo(() => {
    switch (expenseFilter) {
      case "active": return expenses.filter((e) => !e.settled);
      case "settled": return expenses.filter((e) => e.settled);
      default: return expenses;
    }
  }, [expenses, expenseFilter]);

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
    filteredExpenses,
    getShares,
    memberNameMap,
    user.id,
    (expense) => setSelectedExpense(expense),
    handleSettleExpense,
    settlingId
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
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
                {total > 0 && (
                  settledCount > 0
                    ? ` · ${activeTotal.toLocaleString()} ₸ активных`
                    : ` · ${total.toLocaleString()} ₸`
                )}
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

      {/* ═══ Filter Toggle ═══ */}
      {expenses.length > 0 && (
        <div className="flex justify-center px-4 py-1.5 bg-background/80 backdrop-blur-sm border-b border-border/10">
          <div className="flex gap-0.5 bg-muted/60 p-0.5 rounded-lg">
            {([
              { key: "all" as const, label: "Все", count: expenses.length },
              { key: "active" as const, label: "Активные", count: activeCount },
              { key: "settled" as const, label: "Закрытые", count: settledCount },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setExpenseFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-150",
                  expenseFilter === tab.key
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "text-[10px] tabular-nums",
                    expenseFilter === tab.key
                      ? "text-muted-foreground/60"
                      : "text-muted-foreground/30"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Chat Area ═══ */}
      <div className="flex-1 relative min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto px-3 py-2"
        >
          {filteredExpenses.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              {expenses.length === 0 ? (
                <>
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
                </>
              ) : expenseFilter === "active" ? (
                <div className="flex flex-col items-center gap-2 py-12">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/60" />
                  <p className="text-sm font-medium text-muted-foreground/70">
                    Все расходы закрыты! 🎉
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-12">
                  <p className="text-sm text-muted-foreground/50">
                    Нет закрытых расходов
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ── Chat messages ── */
            <div className="space-y-1 pb-2">
              {messageGroups.map((group) => group.items)}

              {/* ── Balance summary at bottom ── */}
              {expenseFilter !== "settled" && balances.filter((b) => b.balance !== 0).length > 0 && (
                <div className="pt-4 space-y-1">
                  <div className="flex justify-center">
                    <Bubble variant="ghost">
                      <BubbleContent className="text-center !p-1">
                        <span className="text-xs font-medium text-muted-foreground/70">
                          💰 Остаток: {activeTotal.toLocaleString()} ₸
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

              {/* ── All settled indicator ── */}
              {expenseFilter !== "settled" && activeCount === 0 && settledCount > 0 && (
                <div className="flex justify-center pt-4">
                  <Bubble variant="ghost">
                    <BubbleContent className="text-center !p-1">
                      <span className="text-xs font-medium text-emerald-500/70">
                        🎉 Все расходы закрыты! Никто никому не должен
                      </span>
                    </BubbleContent>
                  </Bubble>
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
        const isSettled = selectedExpense.settled;
        const canSettle = isMine && !isSettled;
        const paidByName = memberNameMap[selectedExpense.paidBy] || "Пользователь";
        const settledByName = selectedExpense.settledBy
          ? memberNameMap[selectedExpense.settledBy] || "Пользователь"
          : undefined;
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
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-2xl tabular-nums",
                    isSettled && "font-semibold text-muted-foreground/70"
                  )}>
                    {selectedExpense.amount.toLocaleString()} ₸
                  </span>
                  {isSettled && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
                {selectedExpense.description && (
                  <p className={cn(
                    "text-sm truncate mt-0.5",
                    isSettled ? "text-muted-foreground/50" : "text-muted-foreground"
                  )}>
                    {selectedExpense.description}
                  </p>
                )}
                {isSettled && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                    Закрыт
                  </span>
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
              {isSettled && settledByName && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Закрыл</span>
                  <span className="font-medium text-xs text-emerald-600 dark:text-emerald-400">{settledByName}</span>
                </div>
              )}
              <div className={cn("pt-3", !isSettled && "border-t border-border/20")}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Users className="w-4 h-4" />
                  <span>Разделено на {expenseShares.length} человек</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {expenseShares.map((s) => (
                    <span
                      key={s.id}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                        isSettled
                          ? "bg-emerald-500/5 text-muted-foreground/60"
                          : "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {s.name}: {s.shareAmount.toLocaleString()} ₸
                      {isSettled && <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Settle button (только для активных расходов автора) */}
            {canSettle && (
              <button
                onClick={async () => {
                  if (settlingId) return;
                  setSettlingId(selectedExpense.id);
                  try {
                    await settleExpense(selectedExpense.id, user.id);
                    setSelectedExpense(null);
                    showToast("✅ Расход закрыт — все скинулись", "success");
                  } catch {
                    showToast("Не удалось закрыть расход", "error");
                  } finally {
                    setSettlingId(null);
                  }
                }}
                disabled={!!settlingId}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-sm hover:bg-emerald-500/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
              >
                {settlingId === selectedExpense.id ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                    Закрытие...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Отметить, что все скинулись
                  </>
                )}
              </button>
            )}

            {/* Delete button — only for active own expenses */}
            {isMine && !isSettled && (
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
    </div>
  );
}
