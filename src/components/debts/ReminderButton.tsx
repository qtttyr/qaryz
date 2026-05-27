import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useDebtStore } from "@/stores/debtStore";
import { useUserStore } from "@/stores/userStore";

interface ReminderButtonProps {
  personId: string;
}

export default function ReminderButton({ personId }: ReminderButtonProps) {
  const [status, setStatus] = useState<"idle" | "sent" | "copied">("idle");

  const person = useDebtStore((s) => s.getPerson(personId));
  const balance = useDebtStore((s) => s.getPersonBalance(personId));
  const aiTone = useUserStore((s) => s.settings.aiTone);
  const currency = useUserStore((s) => s.profile.currency);

  const currencySymbols: Record<string, string> = {
    KZT: "₸",
    RUB: "₽",
    USD: "$",
  };
  const currencyStr = currencySymbols[currency] || currency;

  const handleRemind = () => {
    if (!person) return;

    const absBalance = Math.abs(balance);
    const name = person.name;

    // Build template message
    let message = "";
    if (balance > 0) {
      if (aiTone === "friendly") {
        message = `${name}, привет! Закинь, пожалуйста, ${absBalance} ${currencyStr} при первой возможности. Спасибо! 💸`;
      } else if (aiTone === "formal") {
        message = `Здравствуйте, ${name}. Напоминаю о необходимости возврата средств в размере ${absBalance} ${currencyStr}. С уважением.`;
      } else {
        // neutral
        message = `Привет, ${name}. Напоминаю о балансе взаиморасчётов: ${absBalance} ${currencyStr}.`;
      }
    } else if (balance < 0) {
      if (aiTone === "friendly") {
        message = `${name}, привет! Хочу вернуть тебе долг в размере ${absBalance} ${currencyStr}. Подскажи, куда лучше скинуть?`;
      } else if (aiTone === "formal") {
        message = `Здравствуйте, ${name}. Хочу уведомить вас о готовности вернуть долг в размере ${absBalance} ${currencyStr}. Сообщите реквизиты для перевода.`;
      } else {
        // neutral
        message = `Привет, ${name}. Хочу вернуть тебе долг: ${absBalance} ${currencyStr}. Напиши, куда перевести.`;
      }
    } else {
      message = `Привет, ${name}! У нас с тобой нет активных долгов.`;
    }

    // Clean phone number for WhatsApp link
    let phone = person.phone ? person.phone.replace(/\D/g, "") : "";
    
    // Automatically correct Russian/Kazakhstani numbers starting with 8 instead of 7
    if (phone.length === 11 && phone.startsWith("8")) {
      phone = "7" + phone.slice(1);
    }

    if (phone) {
      // Open WhatsApp with direct message
      const encodedText = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;
      window.open(whatsappUrl, "_blank");
      
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      // If no phone number, copy to clipboard and fallback to Web Share
      if (navigator.share) {
        navigator.share({
          text: message,
        }).catch((err) => {
          console.warn("Share failed:", err);
          navigator.clipboard.writeText(message);
        });
      } else {
        navigator.clipboard.writeText(message);
      }
      
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const getButtonText = () => {
    if (status === "sent") return "Перешли в WhatsApp!";
    if (status === "copied") return "Текст скопирован! (нет номера)";
    return `Напомнить ${person?.name || ""}`;
  };

  const isButtonDisabled = status !== "idle" || balance === 0;

  return (
    <Button
      variant="outline"
      onClick={handleRemind}
      disabled={isButtonDisabled}
      className="gap-2 rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 select-none shrink-0"
    >
      <HugeiconsIcon icon={Notification01Icon} size={16} />
      <AnimatePresence mode="wait">
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={
            status === "sent"
              ? "text-positive text-sm"
              : status === "copied"
                ? "text-primary text-sm font-medium"
                : "text-sm"
          }
        >
          {getButtonText()}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
