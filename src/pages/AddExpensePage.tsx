import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/types/group";
import { ArrowLeft, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function AddExpensePage() {
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const allMembers = useGroupStore((s) => s.members);
  const addExpense = useGroupStore((s) => s.addExpense);
  const group = useGroupStore((s) => s.groups.find((g) => g.id === groupId));

  const members = useMemo(
    () => allMembers.filter((m) => m.groupId === groupId),
    [allMembers, groupId]
  );

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState(user?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  if (!groupId || !group) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
        <h2 className="text-xl font-semibold">Группа не найдена</h2>
        <Button variant="outline" onClick={() => navigate("/groups")}>
          Назад
        </Button>
      </div>
    );
  }

  const totalAmount = parseFloat(amount) || 0;
  const memberProfiles = members.map((m) => ({
    id: m.userId,
    name: m.nickname || m.name || "Пользователь",
  }));
  const equalShare =
    memberProfiles.length > 0
      ? Math.round((totalAmount / memberProfiles.length) * 100) / 100
      : 0;

  const handleSubmit = async () => {
    if (submitting || !totalAmount || !paidBy) return;
    const shares = memberProfiles.map((m) => ({ userId: m.id, amount: equalShare }));
    setError("");
    setSubmitting(true);
    try {
      await addExpense(groupId, paidBy, totalAmount, description.trim(), category, "equal", shares);
      navigate(`/groups/${groupId}`);
    } catch (e) {
      console.error(e);
      setError("Не удалось добавить расход");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = totalAmount > 0 && !!paidBy && !submitting;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center px-4 h-12 gap-3">
          <button onClick={() => navigate(`/groups/${groupId}`)} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base truncate">Новый расход</h1>
            <p className="text-[11px] text-muted-foreground/60 truncate">{group.name}</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Amount — large, centered */}
        <div className="relative pt-4">
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-center text-5xl sm:text-6xl font-bold bg-transparent border-0 outline-none tabular-nums placeholder:text-muted-foreground/20"
          />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground/30 pointer-events-none">
            ₸
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border/20" />

        {/* Category — emoji grid */}
        <div>
          <label className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-3 block">
            Категория
          </label>
          <div className="grid grid-cols-5 gap-2">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-150",
                  category === cat.value
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "bg-muted/40 text-muted-foreground/70 hover:bg-muted/60"
                )}
              >
                <span className="text-xl sm:text-2xl">{cat.emoji}</span>
                <span className="text-[9px] font-medium leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-2 block">
            Описание <span className="text-muted-foreground/30 normal-case">(необязательно)</span>
          </label>
          <input
            placeholder="Например: Ужин в ресторане"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
            className="w-full h-12 px-4 rounded-2xl bg-muted/40 border border-border/30 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30"
          />
        </div>

        {/* Who paid */}
        <div>
          <label className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-2 block">
            Кто заплатил
          </label>
          <div className="flex flex-wrap gap-2">
            {memberProfiles.map((m) => (
              <button
                key={m.id}
                onClick={() => setPaidBy(m.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  paidBy === m.id
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "bg-muted/40 text-muted-foreground/70 hover:bg-muted/60"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                  paidBy === m.id ? "bg-primary" : "bg-muted-foreground/30"
                )}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Split summary */}
        {totalAmount > 0 && memberProfiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-muted/30 border border-border/20 px-5 py-4 space-y-2"
          >
            <p className="text-xs text-muted-foreground/60">
              Разделить на {memberProfiles.length}{" "}
              {memberProfiles.length === 1 ? "человека" : "человек"} поровну
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                По <span className="font-bold">{equalShare.toLocaleString()} ₸</span> с каждого
              </p>
              <p className="text-xs text-muted-foreground/50">
                = {totalAmount.toLocaleString()} ₸
              </p>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}
      </div>

      {/* Bottom button */}
      <div className="px-4 py-3 border-t bg-background/80 backdrop-blur-sm">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-12 rounded-2xl text-base font-semibold gap-2"
        >
          <Plus className="w-5 h-5" />
          {submitting
            ? "Добавление..."
            : `Добавить расход${totalAmount > 0 ? ` · ${totalAmount.toLocaleString()} ₸` : ""}`}
        </Button>
      </div>
    </div>
  );
}
