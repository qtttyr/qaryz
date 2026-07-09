import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification02Icon, NotificationOff01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PushSetupBannerProps {
  visible: boolean;
  subscribed: boolean;
  permission: string;
  loading: boolean;
  supported: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onDismiss: () => void;
}

export default function PushSetupBanner({
  visible,
  subscribed,
  permission,
  loading,
  supported,
  onEnable,
  onDisable,
  onDismiss,
}: PushSetupBannerProps) {
  if (!visible || !supported) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'relative overflow-hidden rounded-xl border',
          subscribed
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/30'
            : 'bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border-primary/10 dark:border-primary/20'
        )}
      >
        {/* Decorative blobs */}
        {!subscribed && (
          <>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/8 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          </>
        )}

        <div className="relative z-10 p-4 pb-3">
          {/* Dismiss X — top right, safe from button overlap */}
          {!subscribed && !loading && (
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/60 transition-all z-20"
              aria-label="Закрыть"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <div className="flex items-start gap-3 pr-6">
            {/* Icon */}
            <div className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
              subscribed
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-primary/10 text-primary'
            )}>
              <HugeiconsIcon
                icon={subscribed ? Notification02Icon : NotificationOff01Icon}
                size={20}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-semibold leading-tight">
                {subscribed
                  ? 'Уведомления включены'
                  : permission === 'denied'
                    ? 'Уведомления отключены'
                    : 'Не пропускайте долги'}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {subscribed
                  ? 'Напоминания о долгах приходят даже когда приложение закрыто'
                  : permission === 'denied'
                    ? 'Разрешите уведомления в настройках браузера, чтобы не забывать о долгах'
                    : 'Включите — будем присылать напоминания о просрочках и платежах'}
              </p>
            </div>
          </div>

          {/* Action row — separate from text, below it */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            {subscribed ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs px-3"
                onClick={onDisable}
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse text-muted-foreground">...</span>
                ) : (
                  'Отключить'
                )}
              </Button>
            ) : permission === 'denied' ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs text-muted-foreground px-3"
                onClick={onDismiss}
              >
                Понятно
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 rounded-lg text-xs gap-1.5 px-4 font-medium shadow-sm"
                onClick={onEnable}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Настройка...
                  </span>
                ) : (
                  <>
                    <HugeiconsIcon icon={Notification02Icon} size={14} />
                    Включить уведомления
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
