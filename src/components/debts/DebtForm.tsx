import { useState, useEffect } from "react";
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
import type { DebtDirection } from "@/types/debt";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DebtFormProps {
  open: boolean;
  onClose: () => void;
  defaultPersonId?: string;
  defaultDirection?: DebtDirection;
}

export default function DebtForm({
  open,
  onClose,
  defaultPersonId,
  defaultDirection,
}: DebtFormProps) {
  const [direction, setDirection] = useState<DebtDirection>(
    defaultDirection || "owed_to_me"
  );
  const [personName, setPersonName] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState(
    defaultPersonId || ""
  );
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const people = useDebtStore((s) => s.people);
  const addDebt = useDebtStore((s) => s.addDebt);
  const addPerson = useDebtStore((s) => s.addPerson);
  const updatePerson = useDebtStore((s) => s.updatePerson);
  const currency = useUserStore((s) => s.profile.currency);

  useEffect(() => {
    if (selectedPersonId) {
      const person = people.find((p) => p.id === selectedPersonId);
      if (person && person.phone) {
        setPhone(person.phone);
      } else {
        setPhone("");
      }
    } else {
      setPhone("");
    }
  }, [selectedPersonId, people]);

  const currencySymbols: Record<string, string> = {
    KZT: "₸",
    RUB: "₽",
    USD: "$",
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    let personId = selectedPersonId;

    // Create new person if needed
    if (!personId && personName.trim()) {
      personId = addPerson(personName.trim(), phone.trim() || undefined);
    } else if (personId && phone.trim()) {
      updatePerson(personId, { phone: phone.trim() });
    }

    if (!personId) return;

    addDebt({
      personId,
      direction,
      amount: numAmount,
      description: description.trim() || undefined,
    });

    // Reset form
    setPersonName("");
    setSelectedPersonId(defaultPersonId || "");
    setPhone("");
    setAmount("");
    setDescription("");
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const isValid =
    parseFloat(amount) > 0 && (selectedPersonId || personName.trim());

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-2">
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        <SheetHeader className="p-0 mb-5">
          <SheetTitle className="text-xl font-bold">Новый долг</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Запишите кто кому и сколько должен
          </SheetDescription>
        </SheetHeader>

        {/* Direction toggle */}
        <div className="relative flex rounded-xl bg-muted p-1 mb-5">
          <button
            onClick={() => setDirection("owed_to_me")}
            className={cn(
              "relative z-10 flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
              direction === "owed_to_me"
                ? "text-positive-foreground"
                : "text-muted-foreground"
            )}
          >
            Мне должны
          </button>
          <button
            onClick={() => setDirection("i_owe")}
            className={cn(
              "relative z-10 flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
              direction === "i_owe"
                ? "text-white"
                : "text-muted-foreground"
            )}
          >
            Я должен
          </button>
          <motion.div
            layout
            className={cn(
              "absolute top-1 bottom-1 rounded-lg w-[calc(50%-4px)]",
              direction === "owed_to_me" ? "bg-positive" : "bg-negative"
            )}
            animate={{
              left: direction === "owed_to_me" ? 4 : "calc(50% + 0px)",
            }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          />
        </div>

        {/* Person selection */}
        <div className="space-y-3 mb-4">
          <label className="text-sm font-medium text-foreground">Кто?</label>

          {/* Quick select existing people */}
          {people.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {people.map((person) => (
                <button
                  key={person.id}
                  onClick={() => {
                    setSelectedPersonId(
                      selectedPersonId === person.id ? "" : person.id
                    );
                    setPersonName("");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
                    selectedPersonId === person.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {person.name}
                </button>
              ))}
            </div>
          )}

          {/* New person input */}
          <AnimatePresence>
            {!selectedPersonId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <Input
                  placeholder="Имя нового человека"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="h-11 rounded-xl bg-muted/50 border-border/50 text-base"
                />
                <Input
                  placeholder="Номер телефона (необязательно)"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl bg-muted/50 border-border/50 text-base"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Existing person phone input (if selected) */}
          <AnimatePresence>
            {selectedPersonId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  placeholder="Номер телефона (добавить/изменить)"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl bg-muted/50 border-border/50 text-base"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Amount */}
        <div className="space-y-3 mb-4">
          <label className="text-sm font-medium text-foreground">
            Сколько?
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

        {/* Description */}
        <div className="space-y-3 mb-6">
          <label className="text-sm font-medium text-foreground">
            За что?{" "}
            <span className="text-muted-foreground font-normal">
              (необязательно)
            </span>
          </label>
          <Input
            placeholder="Обед, такси, билеты..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-11 rounded-xl bg-muted/50 border-border/50 text-base"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className={cn(
            "w-full h-12 rounded-xl text-base font-semibold transition-all duration-200",
            direction === "owed_to_me"
              ? "bg-positive hover:bg-positive/90 text-white"
              : "bg-negative hover:bg-negative/90 text-white"
          )}
        >
          {direction === "owed_to_me" ? "Записать долг" : "Записать мой долг"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
