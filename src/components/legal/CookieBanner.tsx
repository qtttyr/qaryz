import { motion, AnimatePresence } from "framer-motion";
import { useConsentStore } from "@/stores/consentStore";
import { Button } from "@/components/ui/button";

export default function CookieBanner() {
  const cookieBannerShown = useConsentStore((s) => s.cookieBannerShown);
  const setCookieBannerShown = useConsentStore((s) => s.setCookieBannerShown);

  if (cookieBannerShown) return null;

  return (
    <AnimatePresence>
      {!cookieBannerShown && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="max-w-lg mx-auto bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-foreground leading-relaxed mb-3">
              Мы используем локальное хранилище браузера для обеспечения работы
              приложения. Продолжая использовать Qaryz, вы соглашаетесь с
              условиями обработки данных.
            </p>

            {/* Desktop: row layout | Mobile: column layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex gap-3 text-xs text-muted-foreground">
                <a
                  href="/privacy"
                  className="hover:text-foreground underline underline-offset-2 transition-colors whitespace-nowrap"
                >
                  Конфиденциальность
                </a>
                <a
                  href="/terms"
                  className="hover:text-foreground underline underline-offset-2 transition-colors whitespace-nowrap"
                >
                  Соглашение
                </a>
              </div>
              <Button
                size="sm"
                className="rounded-xl px-6 h-9 text-sm w-full sm:w-auto shrink-0"
                onClick={() => setCookieBannerShown()}
              >
                Принять
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
