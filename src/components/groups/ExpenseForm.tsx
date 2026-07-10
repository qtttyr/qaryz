import { useShallow } from "zustand/react/shallow";
import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { MemberAvatar } from "./MemberAvatar";
import { Equal, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseFormProps {
  groupId: string;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "food", label: "Еда" },
  { value: "transport", label: "Транспорт" },
  { value: "entertainment", label: "Развлечения" },
  { value: "shopping", label: "Покупки" },
  { value: "bills", label: "Счета" },
  { value: "housing", label: "Жильё" },
  { value: "health", label: "Здоровье" },
  { value: "other", label: "Прочее" },
];

export function ExpenseForm({ groupId, onClose }: ExpenseFormProps) {
  const user = useAuthStore((s) => s.user);
  const members = useGroupStore(
    useShallow((s) => s.members.filter((m) => m.groupId === groupId))
  );
  const addExpense = useGroupStore((s) => s.addExpense);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [paidBy, setPaidBy] = useState(user?.id || "");
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const memberProfiles = members.map((m) => ({
    id: m.userId,
    name: m.nickname || m.name || "Пользователь",
  }));

  const totalAmount = parseFloat(amount) || 0;
  const equalShare = memberProfiles.length > 0
    ? Math.round((totalAmount / memberProfiles.length) * 100) / 100
    : 0;

  const handleSubmit = async () => {
    if (!description.trim() || !totalAmount || !paidBy) return;

    const shares = memberProfiles.map((m) => ({
      userId: m.id,
      amount: splitMode === "equal"
        ? equalShare
        : parseFloat(customShares[m.id] || "0") || 0,
    }));

    const totalShares = shares.reduce((s, sh) => s + sh.amount, 0);
    if (Math.abs(totalShares - totalAmount) > 1) {
      return; // Shares don't add up
    }

    setError("");
    setSubmitting(true);
    try {
      await addExpense(groupId, paidBy, totalAmount, description.trim(), category, splitMode, shares);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Не удалось добавить расход. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateCustomShare = (userId: string, value: string) => {
    setCustomShares((prev) => ({ ...prev, [userId]: value }));
  };

  const totalCustom = Object.values(customShares).reduce(
    (sum, v) => sum + (parseFloat(v) || 0), 0
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Новый расход</h2>

      {/* Description */}
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Описание</label>
        <Input
          placeholder="Например: Ужин в ресторане"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Amount + Category */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-sm text-muted-foreground mb-1 block">Сумма</label>
          <Input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={0}
            step={100}
          />
        </div>
        <div className="flex-1">
          <label className="text-sm text-muted-foreground mb-1 block">Категория</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Who paid */}
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Кто заплатил</label>
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

      <Separator />

      {/* Split mode toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-muted-foreground">Способ деления</label>
        <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
          <button
            onClick={() => setSplitMode("equal")}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors",
              splitMode === "equal" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            <Equal className="w-3.5 h-3.5" /> Поровну
          </button>
          <button
            onClick={() => setSplitMode("custom")}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors",
              splitMode === "custom" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            <Settings2 className="w-3.5 h-3.5" /> Свои доли
          </button>
        </div>
      </div>

      {/* Member shares */}
      <div className="space-y-1.5">
        {memberProfiles.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <MemberAvatar name={m.name} size="sm" />
              <span className="text-sm">{m.name}</span>
            </div>
            {splitMode === "equal" ? (
              <span className="text-sm font-medium">
                {equalShare.toLocaleString()} ₸
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  className="w-24 h-8 text-sm text-right"
                  placeholder="0"
                  value={customShares[m.id] || ""}
                  onChange={(e) => updateCustomShare(m.id, e.target.value)}
                  min={0}
                  step={100}
                />
                <span className="text-xs text-muted-foreground">₸</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {splitMode === "custom" && (
        <p className={cn(
          "text-xs text-right",
          Math.abs(totalCustom - totalAmount) <= 1
            ? "text-emerald-500"
            : "text-red-500"
        )}>
          {totalCustom.toLocaleString()} ₸ из {totalAmount.toLocaleString()} ₸
        </p>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            !description.trim() || !totalAmount || !paidBy || submitting ||
            (splitMode === "custom" && Math.abs(totalCustom - totalAmount) > 1)
          }
          className="flex-1"
        >
          {submitting ? "Добавление..." : "Добавить"}
        </Button>
      </div>
    </div>
  );
}
