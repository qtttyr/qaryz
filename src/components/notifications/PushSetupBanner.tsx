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
        initial={{ opacity: 0, y: -12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'relative overflow-hidden rounded-2xl border p-4',
          subscribed
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
            : 'bg-card border-border/50'
        )}
      >
        {/* Background decoration */}
        {!subscribed && (
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
        )}

        <div className="flex items-start gap-3 relative z-10">
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
            subscribed
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
              : 'bg-primary/10 text-primary'
          )}>
            <HugeiconsIcon
              icon={subscribed ? Notification02Icon : NotificationOff01Icon}
              size={20}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {subscribed ? '🔔 Уведомления включены' : 'Не пропускайте долги'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {subscribed
                ? 'Мы будем присылать напоминания о долгах и платежах'
                : permission === 'denied'
                  ? 'Уведомления отключены в настройках браузера. Включите их в Safari → Настройки → Qaryz'
                  : 'Включите уведомления, чтобы получать напоминания о долгах даже когда приложение закрыто'
              }
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {subscribed ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs"
                onClick={onDisable}
                disabled={loading}
              >
                {loading ? '...' : 'Отключить'}
              </Button>
            ) : permission === 'denied' ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs text-muted-foreground"
                onClick={onDismiss}
              >
                Понятно
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 rounded-lg text-xs gap-1"
                onClick={onEnable}
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <>
                    <HugeiconsIcon icon={Notification02Icon} size={14} />
                    Включить
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Dismiss X */}
        {!subscribed && (
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Закрыть"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
