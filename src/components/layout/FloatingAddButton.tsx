import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { useUIStore } from "@/stores/uiStore";
import { useIsMobile } from "@/hooks/use-mobile";

export default function FloatingAddButton() {
  const openModal = useUIStore((s) => s.openModal);
  const isMobile = useIsMobile();

  return (
    <motion.button
      onClick={() => openModal("add-debt")}
      className={`fixed z-50 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 cursor-pointer transition-colors hover:bg-primary/90 active:scale-95 ${
        isMobile
          ? "bottom-20 right-5 w-14 h-14"
          : "bottom-8 right-8 w-12 h-12"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.6, delay: 0.3 }}
    >
      <HugeiconsIcon icon={Add01Icon} size={24} strokeWidth={2.5} />
    </motion.button>
  );
}
