import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface UpdateBannerProps {
  visible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export default function UpdateBanner({ visible, onUpdate, onDismiss }: UpdateBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed top-4 left-4 right-4 z-[60] max-w-md mx-auto"
        >
          <div className="bg-foreground/90 dark:bg-card/95 backdrop-blur-md border border-border/30 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-background dark:text-foreground">
                Доступно обновление
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Новая версия приложения готова
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onDismiss}
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors px-2 py-1"
              >
                Позже
              </button>
              <Button
                size="sm"
                className="h-8 rounded-lg text-xs px-3 font-medium shadow-sm"
                onClick={onUpdate}
              >
                Обновить
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
