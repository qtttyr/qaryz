import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Smartphone,
  Share2,
  Plus,
  ExternalLink,
  ChevronRight,
  Bell,
  Maximize2,
  Wifi,
  Download,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Particles from "@/components/shared/Particles";

// ─── Floating stat cards ───────────────────────────────────

const STATS = [
  { label: "Тебе должны", amount: "124 500", hue: "150" },
  { label: "Ты должен", amount: "7 000", hue: "0" },
  { label: "Всего друзей", amount: "5", hue: "260" },
];

function FloatingStats() {
  return (
    <div className="absolute inset-0 pointer-events-none hidden md:block">
      {STATS.map((stat, i) => {
        const positions = [
          { top: "12%", right: "2%" },
          { bottom: "18%", left: "2%" },
          { top: "42%", left: "-2%" },
        ];
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.25, type: "spring", damping: 18, stiffness: 150 }}
            className="absolute z-20"
            style={positions[i]}
          >
            <div className="bg-card/80 backdrop-blur-md border border-border/40 rounded-xl px-4 py-3 shadow-lg shadow-black/5 min-w-[140px]">
              <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mb-0.5">
                {stat.label}
              </p>
              <p className="text-lg font-black tabular-nums" style={{ color: `oklch(0.55 0.15 ${stat.hue})` }}>
                {stat.amount} ₸
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Phone mockup with app preview ────────────────────────

function HeroPhone() {
  const [cardStep, setCardStep] = useState(0);

  useEffect(() => {
    if (cardStep >= 3) return;
    const t = setTimeout(() => setCardStep((s) => s + 1), [700, 1100, 1500][cardStep]);
    return () => clearTimeout(t);
  }, [cardStep]);

  return (
    <div className="relative mx-auto w-[200px] h-[420px] sm:w-[220px] sm:h-[450px] rounded-[2.5rem] border-4 border-white/10 bg-gradient-to-b from-background to-muted/80 shadow-2xl shadow-black/30 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-white/10 rounded-b-2xl z-10" />
      <div className="absolute inset-0 pt-7 pb-3 px-2.5 flex flex-col gap-2">
        <div className="flex justify-between items-center px-1 text-[8px] text-muted-foreground/60 font-medium">
          <span>9:41</span>
          <div className="flex gap-0.5"><div className="w-3 h-1.5 rounded-sm bg-muted-foreground/40" /></div>
        </div>
        <div className="flex items-center justify-between mt-1 mb-1">
          <p className="text-[9px] font-bold">Мне должны</p>
          <div className="w-4 h-4 rounded-md bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-2.5 h-2.5 text-primary" />
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          <AnimatePresence mode="sync">
            {cardStep >= 0 && (
              <motion.div key="c1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="bg-gradient-to-r from-positive/20 to-positive/5 border border-positive/15 rounded-xl p-2.5">
                <div className="flex items-center justify-between">
                  <div><p className="text-[8px] font-semibold text-positive/80">Айбек</p><p className="text-xs font-black text-positive">+5 000 ₸</p></div>
                  <div className="w-5 h-5 rounded-full bg-positive/20 flex items-center justify-center text-[7px] font-bold text-positive">A</div>
                </div>
              </motion.div>
            )}
            {cardStep >= 1 && (
              <motion.div key="c2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="bg-gradient-to-r from-positive/20 to-positive/5 border border-positive/15 rounded-xl p-2.5">
                <div className="flex items-center justify-between">
                  <div><p className="text-[8px] font-semibold text-positive/80">Алина</p><p className="text-xs font-black text-positive">+3 200 ₸</p></div>
                  <div className="w-5 h-5 rounded-full bg-positive/20 flex items-center justify-center text-[7px] font-bold text-positive">A</div>
                </div>
              </motion.div>
            )}
            {cardStep >= 2 && (
              <motion.div key="c3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="bg-gradient-to-r from-negative/20 to-negative/5 border border-negative/15 rounded-xl p-2.5">
                <div className="flex items-center justify-between">
                  <div><p className="text-[8px] font-semibold text-negative/80">Ержан</p><p className="text-xs font-black text-negative">-2 000 ₸</p></div>
                  <div className="w-5 h-5 rounded-full bg-negative/20 flex items-center justify-center text-[7px] font-bold text-negative">E</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex justify-around py-1.5 border-t border-border/20">
          {["Главная", "Аналитика", "Профиль"].map((tab, i) => (
            <div key={tab} className={`text-[6px] font-medium ${i === 0 ? "text-positive" : "text-muted-foreground/40"}`}>{tab}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tutorial Slide 1: Benefits ───────────────────────────

const BENEFITS = [
  { icon: Maximize2, label: "На весь экран" },
  { icon: Bell, label: "Уведомления" },
  { icon: Wifi, label: "Без интернета" },
];

function BenefitsSlide({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, type: "spring", damping: 15, stiffness: 180 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/10 text-[10px] text-primary font-medium tracking-wider uppercase mb-5"
        >
          <Sparkles className="w-3 h-3" />
          Супер-способность
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-2xl sm:text-3xl font-black tracking-tight"
        >
          Преврати Qaryz
          <br />
          в <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">настоящее приложение</span>
        </motion.h2>
      </motion.div>

      {/* Benefits — floating pills */}
      <div className="flex flex-col items-center gap-4">
        {BENEFITS.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.15, type: "spring", damping: 18, stiffness: 160 }}
            className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-card/60 border border-border/20 w-full max-w-[240px]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <b.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-semibold">{b.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Next button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12"
      >
        <button
          onClick={onNext}
          className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-foreground transition-colors group"
        >
          Как установить?
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </motion.div>
    </div>
  );
}

// ─── Tutorial Slide 2: Steps ──────────────────────────────

function StepsSlide({ onNext }: { onNext: () => void }) {
  const [platform, setPlatform] = useState<"ios" | "android">("ios");

  useEffect(() => {
    if (/android/i.test(navigator.userAgent)) setPlatform("android");
  }, []);

  const iOS = [
    { icon: Share2, title: "Share", desc: "Кнопка «Поделиться»" },
    { icon: Plus, title: "Экран «Домой»", desc: "Выбери в меню" },
    { icon: ExternalLink, title: "Готово!", desc: "Иконка на рабочем столе" },
  ];
  const Android = [
    { icon: Share2, title: "Меню", desc: "⋮ в правом углу" },
    { icon: Download, title: "Установить", desc: "Выбери в меню" },
    { icon: ExternalLink, title: "Готово!", desc: "Иконка на рабочем столе" },
  ];
  const steps = platform === "ios" ? iOS : Android;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <motion.h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
          3 простых шага
        </motion.h2>

        {/* Platform toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-1.5 mt-4"
        >
          {(["ios", "android"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all",
                platform === p
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
            >
              {p === "ios" ? "iPhone" : "Android"}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Steps as a horizontal row */}
      <div className="flex items-start gap-6 sm:gap-10">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
            className="flex flex-col items-center text-center gap-3"
          >
            {/* Step circle */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 200, damping: 16 }}
                className="w-14 h-14 rounded-2xl bg-muted/80 border border-border/20 flex items-center justify-center"
              >
                <s.icon className="w-6 h-6 text-muted-foreground/60" />
              </motion.div>
              {/* Step number */}
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-sm">
                {i + 1}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold">{s.title}</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-tight">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Connecting dots between steps */}
      <div className="flex gap-6 sm:gap-10 mt-2">
        {[1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.15 }}
            className="w-14 sm:w-[4.5rem] h-px bg-border/40 -mt-[4.5rem]"
          />
        ))}
      </div>

      {/* Next */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12"
      >
        <button
          onClick={onNext}
          className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-foreground transition-colors group"
        >
          Всё готово?
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </motion.div>
    </div>
  );
}

// ─── Tutorial Slide 3: CTA ────────────────────────────────

function CTASlide({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 140 }}
        className="w-20 h-20 rounded-[26px] bg-gradient-to-br from-primary/20 to-emerald-400/10 border border-primary/10 flex items-center justify-center mb-8 shadow-xl shadow-primary/5"
      >
        <Smartphone className="w-9 h-9 text-primary" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-2xl sm:text-3xl font-black tracking-tight text-center mb-2"
      >
        Всё готово
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="text-sm text-muted-foreground text-center max-w-[260px]"
      >
        Осталось только войти — и можешь начинать
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-10 w-full max-w-xs"
      >
        <Button
          size="lg"
          className="w-full h-12 px-7 rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 relative overflow-hidden group"
          onClick={onNext}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          Войти и начать
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-4 text-xs text-muted-foreground/40 text-center"
        >
          Бесплатно. Без рекламы. Честно.
        </motion.p>
      </motion.div>
    </div>
  );
}

// ─── Tutorial wrapper ─────────────────────────────────────

const TUTORIAL_SLIDES = [
  { id: "benefits", component: BenefitsSlide },
  { id: "steps", component: StepsSlide },
  { id: "cta", component: CTASlide },
];

function TutorialSection({ onFinish }: { onFinish: () => void }) {
  const [slide, setSlide] = useState(0);

  const SlideComponent = TUTORIAL_SLIDES[slide].component;

  const next = () => {
    if (slide < TUTORIAL_SLIDES.length - 1) setSlide((s) => s + 1);
    else onFinish();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={TUTORIAL_SLIDES[slide].id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 flex flex-col"
          >
            <SlideComponent onNext={next} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-2 pb-8">
        {TUTORIAL_SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSlide(i)}
            className={cn(
              "rounded-full transition-all duration-300",
              i === slide
                ? "w-6 h-1.5 bg-primary"
                : "w-1.5 h-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Hero section ─────────────────────────────────────────

function HeroSection({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/10 text-xs text-primary font-medium mb-3 sm:mb-4"
      >
        <Smartphone className="w-3.5 h-3.5" />
        Не требует App Store
      </motion.div>

      <div className="relative mb-3 sm:mb-4">
        <HeroPhone />
        <FloatingStats />
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-[26px] sm:text-4xl font-black tracking-tight leading-[1.15] text-center max-w-md"
      >
        Не теряй деньги{" "}
        <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
          в чатах
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-sm text-center mt-2"
      >
        5 секунд на запись. Никаких таблиц.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="flex flex-wrap items-center justify-center gap-2 mt-3 sm:mt-4"
      >
        {["Работает офлайн", "Меньше 1 МБ", "Бесплатно"].map((tag) => (
          <span key={tag} className="px-2.5 py-1 rounded-full bg-muted/50 border border-border/30 text-[11px] font-medium text-muted-foreground">{tag}</span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.5 }}
        className="mt-5 sm:mt-6 w-full max-w-xs"
      >
        <Button
          size="lg"
          className="w-full h-12 px-7 rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 relative overflow-hidden group"
          onClick={onNext}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          Начать
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const authState = useAuthStore((s) => s.state);
  const [step, setStep] = useState<"hero" | "tutorial">("hero");

  useEffect(() => {
    if (authState === "authenticated") navigate("/", { replace: true });
  }, [authState, navigate]);

  if (authState === "loading" || authState === "authenticated") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const goNext = () => setStep("tutorial");
  const goAuth = () => navigate("/auth");

  return (
    <div className="min-h-dvh bg-background relative overflow-hidden flex flex-col">
      <motion.div
        className="fixed inset-0 -z-10"
        animate={{
          background: [
            "radial-gradient(ellipse at 30% 20%, oklch(0.15 0.06 150 / 0.25) 0%, transparent 60%)",
            "radial-gradient(ellipse at 70% 80%, oklch(0.15 0.06 260 / 0.2) 0%, transparent 60%)",
            "radial-gradient(ellipse at 50% 50%, oklch(0.15 0.06 190 / 0.2) 0%, transparent 60%)",
            "radial-gradient(ellipse at 30% 20%, oklch(0.15 0.06 150 / 0.25) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <Particles count={12} />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px]" />

      <div className="relative z-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step === "hero" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex-1 flex flex-col"
            >
              <div className="px-6 pt-4 sm:pt-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-black text-primary">Q</span>
                  </div>
                  <span className="text-sm font-bold text-foreground/40">Qaryz</span>
                </div>
              </div>
              <HeroSection onNext={goNext} />
            </motion.div>
          )}

          {step === "tutorial" && (
            <motion.div
              key="tutorial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex-1 flex flex-col"
            >
              <div className="px-6 pt-4 sm:pt-5 flex items-center justify-between">
                <button
                  onClick={() => setStep("hero")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  Назад
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-foreground/30">Qaryz</span>
                </div>
              </div>
              <TutorialSection onFinish={goAuth} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
