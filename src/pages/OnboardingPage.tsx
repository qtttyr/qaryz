import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiMagicIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

// ─── Screens ───────────────────────────────────────────────

const SCREENS = [
  {
    id: "hook",
    duration: 3500,
  },
  {
    id: "insight",
    duration: 4000,
  },
  {
    id: "magic",
    duration: 4000,
  },
  {
    id: "install",
    duration: null, // manual
  },
];

// ─── Floating Particles ────────────────────────────────────

function Particles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 3,
    duration: Math.random() * 4 + 4,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/10 dark:bg-primary/5"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Phone Mockup ──────────────────────────────────────────

function PhoneMockup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[240px] h-[500px] rounded-[2.5rem] border-4 border-foreground/10 bg-background shadow-2xl shadow-black/20 overflow-hidden",
        className
      )}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/10 rounded-b-2xl z-10" />
      {/* Screen */}
      <div className="absolute inset-0 pt-8 pb-4 px-3 flex flex-col">{children}</div>
    </div>
  );
}

// ─── Screen 1: Hook (Chat Simulation) ──────────────────────

function HookScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= 3) return;
    const timings = [600, 900, 1200];
    const t = setTimeout(() => setStep((s) => s + 1), timings[step]);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step >= 3) {
      const t = setTimeout(onDone, 800);
      return () => clearTimeout(t);
    }
  }, [step, onDone]);

  return (
    <div className="flex flex-col h-full justify-between py-4">
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase"
        >
          Чат с другом
        </motion.p>
      </div>

      <div className="space-y-3 px-1">
        <AnimatePresence mode="sync">
          {step >= 0 && (
            <motion.div
              key="msg1"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="flex items-start gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-negative/20 flex items-center justify-center text-[10px] font-bold text-negative shrink-0">
                A
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                <p className="text-xs font-medium">Айбек</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Скинь 5000 до завтра, очень надо 🙏
                </p>
              </div>
            </motion.div>
          )}

          {step >= 1 && (
            <motion.div
              key="msg2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="flex items-start gap-2 justify-end"
            >
              <div className="bg-primary rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                <p className="text-xs font-medium text-primary-foreground">Ок, скинул</p>
              </div>
            </motion.div>
          )}

          {step >= 2 && (
            <motion.div
              key="msg3"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="flex items-start gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-negative/20 flex items-center justify-center text-[10px] font-bold text-negative shrink-0">
                A
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                <p className="text-xs">Спасибо, бро 🔥</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 20, stiffness: 200 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-positive/10 text-positive text-xs font-semibold px-4 py-2 rounded-full">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
            Долг записан
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Screen 2: Insight ─────────────────────────────────────

function InsightScreen({ onDone }: { onDone: () => void }) {
  const [showCard, setShowCard] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowCard(true), 400);
    const t2 = setTimeout(() => setShowText(true), 1400);
    const t3 = setTimeout(onDone, 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div className="flex flex-col h-full justify-center items-center gap-6 px-2">
      {/* Animated phone with card */}
      <PhoneMockup>
        <div className="flex flex-col h-full justify-center items-center px-2">
          <AnimatePresence>
            {showCard && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 18,
                  stiffness: 180,
                }}
                className="w-full rounded-2xl bg-gradient-to-br from-positive/20 to-positive/5 border border-positive/20 p-4 text-center"
              >
                <p className="text-[10px] text-positive/70 font-semibold tracking-widest uppercase mb-1">
                  Айбек должен
                </p>
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", damping: 15, stiffness: 150 }}
                  className="text-3xl font-black text-positive tabular-nums"
                >
                  5 000 ₸
                </motion.p>
                <p className="text-[10px] text-muted-foreground mt-2">до завтра</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneMockup>

      {/* Text */}
      <AnimatePresence>
        {showText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-1"
          >
            <h2 className="text-xl font-bold">Ты не забудешь</h2>
            <p className="text-sm text-muted-foreground">
              Qaryz сам напомнит, когда нужно
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Screen 3: Magic ───────────────────────────────────────

function MagicScreen({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);
  const [showUI, setShowUI] = useState(false);
  const target = 124500;
  const duration = 2000;
  const startTime = Date.now();

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
    }, 16);

    const t1 = setTimeout(() => setShowUI(true), 2600);
    const t2 = setTimeout(onDone, 3800);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  const formatted = new Intl.NumberFormat("ru-RU").format(count);

  return (
    <div className="flex flex-col h-full justify-center items-center gap-6 px-2">
      {/* Animated counter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-center"
      >
        <p className="text-xs text-muted-foreground font-medium mb-2 tracking-widest uppercase">
          Тебе должны
        </p>
        <div className="relative">
          <motion.p
            className="text-5xl font-black tabular-nums bg-gradient-to-r from-primary to-electric bg-clip-text text-transparent"
            animate={{ scale: count > 0 && count < target ? [1, 1.03, 1] : 1 }}
            transition={{ duration: 0.2 }}
          >
            {formatted}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="text-2xl font-black text-positive"
          >
            ₸
          </motion.p>
        </div>
        <motion.p
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="h-1 bg-gradient-to-r from-primary/40 to-electric/40 rounded-full mt-4"
        />
      </motion.div>

      {/* Reveal Qaryz UI elements */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 180 }}
            className="w-full max-w-[220px] space-y-2"
          >
            <div className="flex items-center justify-between bg-card border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-positive to-emerald-400 flex items-center justify-center text-[10px] font-bold text-white">
                  A
                </div>
                <div>
                  <p className="text-xs font-semibold">Айбек</p>
                  <p className="text-[10px] text-positive font-semibold">+12 500 ₸</p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: [0, 15, 0] }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <HugeiconsIcon icon={AiMagicIcon} size={16} className="text-primary" />
              </motion.div>
            </div>

            <div className="flex items-center justify-between bg-card border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-negative to-orange-400 flex items-center justify-center text-[10px] font-bold text-white">
                  A
                </div>
                <div>
                  <p className="text-xs font-semibold">Алина</p>
                  <p className="text-[10px] text-negative font-semibold">-7 000 ₸</p>
                </div>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-negative/50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Screen 4: Install Guide ───────────────────────────────

function InstallScreen({ onDone }: { onDone: () => void }) {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua));
  }, []);

  return (
    <div className="flex flex-col h-full justify-center items-center gap-5 px-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 160 }}
      >
        <PhoneMockup className="scale-[0.85] -mb-4">
          <div className="flex flex-col h-full justify-between py-6">
            {/* Fake browser UI */}
            <div className="flex items-center gap-1.5 px-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex-1 h-4 bg-muted rounded-full flex items-center justify-center">
                <span className="text-[6px] text-muted-foreground">qaryz.app</span>
              </div>
              {isIOS ? (
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-primary">
                    <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-primary">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 5V3M12 21v-2M19 12h2M3 12h2M16.95 7.05l1.41-1.41M5.64 18.36l1.41-1.41M18.36 18.36l-1.41-1.41M7.05 7.05L5.64 5.64"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </motion.div>
              )}
            </div>

            {/* Animated hand pointing */}
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                animate={{
                  y: isIOS ? [0, -40, 0] : [0, -35, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path d="M6 20L18 20M18 20L14 16M18 20L14 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            </div>
          </div>
        </PhoneMockup>
      </motion.div>

      {/* Install info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-1"
      >
        <h2 className="text-xl font-bold">Установи на экран</h2>
        <p className="text-sm text-muted-foreground max-w-[260px]">
          {isIOS
            ? "Нажми Share  →  Добавить на экран «Домой»"
            : "Нажни ⋮  →  Установить приложение"}
        </p>
      </motion.div>

      {/* Get started button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="pt-2"
      >
        <Button
          onClick={onDone}
          className="h-12 px-8 rounded-xl text-base gap-2 font-semibold"
        >
          Поехали
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Main Onboarding Component ─────────────────────────────

export default function OnboardingPage() {
  const [screen, setScreen] = useState(0);
  const navigate = useNavigate();

  // Force light theme on onboarding
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const next = useCallback(() => {
    if (screen < SCREENS.length - 1) {
      setScreen((s) => s + 1);
    }
  }, [screen]);

  const finish = useCallback(() => {
    localStorage.setItem("qaryz-onboarded", "true");
    navigate("/");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden relative">
      {/* Animated gradient background */}
      <motion.div
        className="fixed inset-0 -z-10"
        animate={{
          background: [
            "radial-gradient(ellipse at 30% 20%, oklch(0.15 0.06 260 / 0.3) 0%, transparent 60%)",
            "radial-gradient(ellipse at 70% 80%, oklch(0.15 0.06 150 / 0.3) 0%, transparent 60%)",
            "radial-gradient(ellipse at 50% 50%, oklch(0.15 0.06 280 / 0.2) 0%, transparent 60%)",
            "radial-gradient(ellipse at 30% 20%, oklch(0.15 0.06 260 / 0.3) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <Particles />

      <AnimatePresence mode="wait">
        {SCREENS[screen].id === "hook" && (
          <motion.div
            key="hook"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm px-6"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 150 }}
              >
                <PhoneMockup>
                  <HookScreen onDone={next} />
                </PhoneMockup>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase">
                  Друг попросил в долг
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {SCREENS[screen].id === "insight" && (
          <motion.div
            key="insight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm px-6"
          >
            <InsightScreen onDone={next} />
          </motion.div>
        )}

        {SCREENS[screen].id === "magic" && (
          <motion.div
            key="magic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm px-6"
          >
            <MagicScreen onDone={next} />
          </motion.div>
        )}

        {SCREENS[screen].id === "install" && (
          <motion.div
            key="install"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm px-6"
          >
            <InstallScreen onDone={finish} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen indicator dots */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {SCREENS.map((s, i) => (
          <motion.div
            key={s.id}
            className={cn(
              "rounded-full transition-all duration-300",
              i === screen
                ? "w-6 h-1.5 bg-primary"
                : "w-1.5 h-1.5 bg-muted-foreground/30"
            )}
            layout
            layoutId="dot"
          />
        ))}
      </div>

      {/* Skip button */}
      {screen < SCREENS.length - 1 && (
        <button
          onClick={finish}
          className="fixed top-6 right-6 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Пропустить
        </button>
      )}
    </div>
  );
}
