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
import { useFriendStore } from "@/stores/friendStore";
import { useUserStore } from "@/stores/userStore";
import { useAuthStore } from "@/stores/authStore";
import type { DebtDirection } from "@/types/debt";
import { cn } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

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
  const [mode, setMode] = useState<"friend" | "manual">("friend");
  const [submitting, setSubmitting] = useState(false);

  const people = useDebtStore((s) => s.people);
  const addDebt = useDebtStore((s) => s.addDebt);
  const addPerson = useDebtStore((s) => s.addPerson);
  const updatePerson = useDebtStore((s) => s.updatePerson);
  const addSharedDebt = useDebtStore((s) => s.addSharedDebt);
  const currency = useUserStore((s) => s.profile.currency);

  const friends = useFriendStore((s) => s.friends);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (selectedPersonId) {
      const person = people.find((p) => p.id === selectedPersonId);
      if (person?.phone) {
        setPhone(person.phone);
        return;
      }
      // Fallback: check friendStore for phone
      const friend = friends.find((f) => {
        const otherId = f.userId === user?.id ? f.friendId : f.userId;
        return otherId === selectedPersonId;
      });
      setPhone(friend?.phone || "");
    } else {
      setPhone("");
    }
  }, [selectedPersonId, people, friends, user?.id]);

  // When friends update, pre-select if we have matching person
  useEffect(() => {
    if (!selectedPersonId && defaultPersonId) {
      setSelectedPersonId(defaultPersonId);
      const isFriend = friends.some((f) => {
        const otherId = f.userId === user?.id ? f.friendId : f.userId;
        return otherId === defaultPersonId;
      });
      setMode(isFriend ? "friend" : "manual");
    }
  }, [friends, defaultPersonId, selectedPersonId, user?.id]);

  const currencySymbols: Record<string, string> = {
    KZT: "₸", RUB: "₽", USD: "$",
  };

  const isFriendPerson = (personId: string) => {
    return friends.some((f) => {
      const otherId = f.userId === user?.id ? f.friendId : f.userId;
      return otherId === personId;
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    let personId = selectedPersonId;
    setSubmitting(true);

    try {
      // If friend mode and a friend is selected → use shared debt
      if (mode === "friend" && personId && isFriendPerson(personId)) {
        await addSharedDebt(personId, numAmount, direction, description.trim() || undefined);
      } else {
        // Manual flow
        if (!personId && personName.trim()) {
          personId = await addPerson(personName.trim(), phone.trim() || undefined);
        } else if (personId && phone.trim()) {
          updatePerson(personId, { phone: phone.trim() });
        }
        if (!personId) return;

        await addDebt({
          personId,
          direction,
          amount: numAmount,
          description: description.trim() || undefined,
        });
      }
    } catch (e) {
      // If shared debt fails (e.g. RLS, table missing), show error and keep form open
      console.error("Failed to save debt:", e);
      setSubmitting(false);
      return;
    }

    // Reset
    setPersonName("");
    setSelectedPersonId("");
    setPhone("");
    setAmount("");
    setDescription("");
    setMode("friend");
    setSubmitting(false);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
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
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Кто?</label>
            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setMode("friend")}
                className={cn(
                  "px-3 py-1 text-xs rounded-md font-medium transition-colors",
                  mode === "friend" ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
              >
                <Users className="w-3 h-3 inline mr-1" /> Друзья
              </button>
              <button
                onClick={() => setMode("manual")}
                className={cn(
                  "px-3 py-1 text-xs rounded-md font-medium transition-colors",
                  mode === "manual" ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
              >
                Вручную
              </button>
            </div>
          </div>

          {/* Friend selector */}
          <AnimatePresence mode="wait">
            {mode === "friend" && (
              <motion.div
                key="friends"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {friends.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {friends.map((f) => {
                      const friendUserId = f.userId === user?.id ? f.friendId : f.userId;
                      const isSelected = selectedPersonId === friendUserId;
                      const friendName = f.name || "Пользователь";
                      // Find if this friend already has a person entry via debtStore
                      const existingPerson = people.find((p) => p.id === friendUserId);
                      const personId = existingPerson?.id || friendUserId;

                      return (
                        <button
                          key={f.id}
                          onClick={() => {
                            setSelectedPersonId(
                              isSelected ? "" : personId
                            );
                            setPersonName("");
                            if (f.phone) setPhone(f.phone);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                          )}
                        >
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-muted shrink-0">
                            {f.avatar ? (
                              <img src={f.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className={cn(
                                "w-full h-full flex items-center justify-center text-[8px] font-bold text-white",
                                getAvatarColor(friendName)
                              )}>
                                {getInitials(friendName)}
                              </div>
                            )}
                          </div>
                          {friendName}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 px-3 rounded-xl bg-muted/50">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    Нет друзей в системе. Добавьте друзей или выберите «Вручную»
                  </div>
                )}

                {selectedPersonId && mode === "friend" && !phone && (
                  <div className="mt-2">
                    <Input
                      placeholder="Номер телефона (для напоминаний)"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 rounded-xl bg-muted/50 border-border/50 text-base"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Manual input */}
            {mode === "manual" && (
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                {/* Quick select existing people (non-friend) */}
                {people.filter((p) => !isFriendPerson(p.id)).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {people.filter((p) => !isFriendPerson(p.id)).map((person) => (
                      <button
                        key={person.id}
                        onClick={() => {
                          setSelectedPersonId(
                            selectedPersonId === person.id ? "" : person.id
                          );
                          setPersonName("");
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
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

                {!selectedPersonId && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Имя человека"
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
                  </div>
                )}
                {selectedPersonId && (
                  <Input
                    placeholder="Номер телефона (добавить/изменить)"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 rounded-xl bg-muted/50 border-border/50 text-base"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Amount */}
        <div className="space-y-3 mb-4">
          <label className="text-sm font-medium text-foreground">Сколько?</label>
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
            <span className="text-muted-foreground font-normal">(необязательно)</span>
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
          disabled={!isValid || submitting}
          className={cn(
            "w-full h-12 rounded-xl text-base font-semibold transition-all duration-200",
            submitting && "opacity-70",
            direction === "owed_to_me"
              ? "bg-positive hover:bg-positive/90 text-white"
              : "bg-negative hover:bg-negative/90 text-white"
          )}
        >
          {submitting ? "Сохранение..." : direction === "owed_to_me" ? "Записать долг" : "Записать мой долг"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
