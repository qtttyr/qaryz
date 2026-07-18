import { useState, useRef, useEffect, useMemo } from "react";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/types/group";

interface QuickExpenseModalProps {
  groupId: string;
  onClose: () => void;
}

export function QuickExpenseModal({ groupId, onClose }: QuickExpenseModalProps) {
  const user = useAuthStore((s) => s.user);
  const allMembers = useGroupStore((s) => s.members);
  const members = useMemo(() => allMembers.filter((m) => m.groupId === groupId), [allMembers, groupId]);
  const addExpense = useGroupStore((s) => s.addExpense);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState(user?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus amount input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const totalAmount = parseFloat(amount) || 0;
  const memberProfiles = members.map((m) => ({
    id: m.userId,
    name: m.nickname || m.name || "Пользователь",
  }));
  const equalShare = memberProfiles.length > 0
    ? Math.round((totalAmount / memberProfiles.length) * 100) / 100
    : 0;

  const handleSubmit = async () => {
    if (submitting || !totalAmount || !paidBy) return;

    const shares = memberProfiles.map((m) => ({
      userId: m.id,
      amount: equalShare,
    }));

    setError("");
    setSubmitting(true);
    try {
      await addExpense(groupId, paidBy, totalAmount, description.trim(), category, "equal", shares);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Не удалось добавить расход");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Amount — big and prominent */}
      <div>
        <label className="text-xs text-muted-foreground font-medium mb-2 block">
          Сумма
        </label>
        <div className="relative">
          <Input
            ref={inputRef}
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={0}
            step={100}
            className="text-3xl sm:text-4xl font-bold h-16 text-center tabular-nums"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground/60">
            ₸
          </span>
        </div>
      </div>

      {/* Category — horizontal scroll with emoji */}
      <div>
        <label className="text-xs text-muted-foreground font-medium mb-2 block">
          Категория
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={cn(
                "flex flex-col items-center gap-1 shrink-0 px-4 py-2.5 rounded-xl transition-all duration-150",
                category === cat.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="text-[10px] font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
          За что? <span className="text-muted-foreground/40">(необязательно)</span>
        </label>
        <Input
          placeholder="Например: Ужин, такси, продукты..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Who paid */}
      <div>
        <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
          Кто заплатил
        </label>
        <Select value={paidBy} onValueChange={setPaidBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {memberProfiles.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      {totalAmount > 0 && memberProfiles.length > 0 && (
        <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-1">
          <p className="text-xs text-muted-foreground">
            Разделить на {memberProfiles.length}{" "}
            {memberProfiles.length === 1 ? "человека" : "человек"}:
          </p>
          <p className="text-sm font-semibold">
            По {equalShare.toLocaleString()} ₸ с каждого
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!totalAmount || !paidBy || submitting}
          className="flex-1"
        >
          {submitting ? "Добавление..." : "Добавить"}
        </Button>
      </div>
    </div>
  );
}
