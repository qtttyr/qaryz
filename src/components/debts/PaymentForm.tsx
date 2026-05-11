import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebtStore } from "@/stores/debtStore";
import { useUserStore } from "@/stores/userStore";
import { formatCurrency } from "@/lib/formatters";

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  debtId?: string;
}

export default function PaymentForm({ open, onClose, debtId }: PaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const addPayment = useDebtStore((s) => s.addPayment);
  const getRemainingAmount = useDebtStore((s) => s.getRemainingAmount);
  const debts = useDebtStore((s) => s.debts);
  const people = useDebtStore((s) => s.people);
  const currency = useUserStore((s) => s.profile.currency);

  const debt = debts.find((d) => d.id === debtId);
  const remaining = debtId ? getRemainingAmount(debtId) : 0;
  const person = debt ? people.find((p) => p.id === debt.personId) : null;

  const currencySymbols: Record<string, string> = {
    KZT: "₸",
    RUB: "₽",
    USD: "$",
  };

  const handleSubmit = () => {
    if (!debtId) return;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    addPayment(debtId, numAmount, note.trim() || undefined);

    setAmount("");
    setNote("");
    onClose();
  };

  const handlePayFull = () => {
    if (!debtId || remaining <= 0) return;
    addPayment(debtId, remaining, "Полное погашение");
    setAmount("");
    setNote("");
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-2">
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        <SheetHeader className="p-0 mb-5">
          <SheetTitle className="text-xl font-bold">Погашение</SheetTitle>
          <SheetDescription>
            {person
              ? `${debt?.direction === "owed_to_me" ? `${person.name} возвращает` : `Вы возвращаете ${person.name}`}`
              : "Внесите оплату"}
          </SheetDescription>
        </SheetHeader>

        {/* Remaining amount */}
        {remaining > 0 && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 mb-5">
            <span className="text-sm text-muted-foreground">Остаток</span>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(remaining, currency)}
            </span>
          </div>
        )}

        {/* Quick pay full button */}
        {remaining > 0 && (
          <Button
            variant="outline"
            onClick={handlePayFull}
            className="w-full h-11 rounded-xl mb-4 border-positive/30 text-positive hover:bg-positive/10 font-medium"
          >
            Погасить полностью — {formatCurrency(remaining, currency)}
          </Button>
        )}

        {/* Amount input */}
        <div className="space-y-3 mb-4">
          <label className="text-sm font-medium text-foreground">
            Или введите сумму
          </label>
          <div className="relative">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 rounded-xl bg-muted/50 border-border/50 text-2xl font-bold text-center pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground font-medium">
              {currencySymbols[currency] || currency}
            </span>
          </div>
        </div>

        {/* Note */}
        <div className="space-y-3 mb-6">
          <label className="text-sm font-medium text-foreground">
            Заметка{" "}
            <span className="text-muted-foreground font-normal">
              (необязательно)
            </span>
          </label>
          <Input
            placeholder="Каспи, наличные..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-11 rounded-xl bg-muted/50 border-border/50 text-base"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full h-12 rounded-xl text-base font-semibold bg-positive hover:bg-positive/90 text-white"
        >
          Внести оплату
        </Button>
      </SheetContent>
    </Sheet>
  );
}
