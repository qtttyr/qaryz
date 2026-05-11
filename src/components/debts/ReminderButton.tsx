import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";

interface ReminderButtonProps {
  personName: string;
}

export default function ReminderButton({ personName }: ReminderButtonProps) {
  const [sent, setSent] = useState(false);

  const handleRemind = () => {
    // In a real app, this would send a push/SMS/etc.
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <Button
      variant="outline"
      onClick={handleRemind}
      disabled={sent}
      className="gap-2 rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
    >
      <HugeiconsIcon icon={Notification01Icon} size={16} />
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.span
            key="sent"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-positive text-sm"
          >
            Напоминание отправлено!
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm"
          >
            Напомнить {personName}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
