import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Play } from "lucide-react";
import Particles from "@/components/shared/Particles";

// ─── Floating stats (desktop) ──────────────────────────────

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
          { top: "10%", right: "-5%" },
          { bottom: "18%", left: "-5%" },
          { top: "44%", left: "-8%" },
        ];
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.8 + i * 0.25,
              type: "spring",
              damping: 18,
              stiffness: 150,
            }}
            className="absolute z-20"
            style={positions[i]}
          >
            <div className="bg-card/80 backdrop-blur-md border border-border/40 rounded-xl px-4 py-3 shadow-lg shadow-black/5 min-w-[140px]">
              <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mb-0.5">
                {stat.label}
              </p>
              <p
                className="text-lg font-black tabular-nums"
                style={{ color: `oklch(0.55 0.15 ${stat.hue})` }}
              >
                {stat.amount} ₸
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Phone mockup ─────────────────────────────────────────

function HeroPhone() {
  const [cardStep, setCardStep] = useState(0);

  useEffect(() => {
    if (cardStep >= 3) return;
    const t = setTimeout(
      () => setCardStep((s) => s + 1),
      [700, 1100, 1500][cardStep],
    );
    return () => clearTimeout(t);
  }, [cardStep]);

  return (
    <div className="relative mx-auto w-[150px] h-[310px] sm:w-[190px] sm:h-[400px] md:w-[220px] md:h-[460px] lg:w-[240px] lg:h-[500px] rounded-[2rem] md:rounded-[2.5rem] border-4 border-white/10 bg-gradient-to-b from-background to-muted/80 shadow-2xl shadow-black/30 overflow-hidden">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-4 md:h-5 bg-white/10 rounded-b-2xl z-10" />

      {/* Screen */}
      <div className="absolute inset-0 pt-5 md:pt-7 pb-2 md:pb-3 px-2 md:px-2.5 flex flex-col gap-1 md:gap-2">
        {/* Status bar */}
        <div className="flex justify-between items-center px-1 text-[7px] md:text-[8px] text-muted-foreground/60 font-medium">
          <span>9:41</span>
          <div className="w-2.5 md:w-3 h-1 md:h-1.5 rounded-sm bg-muted-foreground/40" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mt-0.5 mb-0.5">
          <p className="text-[7px] md:text-[9px] font-bold">Мне должны</p>
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-md bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-2 h-2 md:w-2.5 md:h-2.5 text-primary" />
          </div>
        </div>

        {/* Cards */}
        <div className="flex-1 space-y-1 md:space-y-1.5">
          <AnimatePresence mode="sync">
            {cardStep >= 0 && (
              <motion.div
                key="c1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="bg-gradient-to-r from-positive/20 to-positive/5 border border-positive/15 rounded-lg md:rounded-xl p-1.5 md:p-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[6px] md:text-[8px] font-semibold text-positive/80">Айбек</p>
                    <p className="text-[9px] md:text-xs font-black text-positive">+5 000 ₸</p>
                  </div>
                  <div className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-positive/20 flex items-center justify-center text-[5px] md:text-[7px] font-bold text-positive">A</div>
                </div>
              </motion.div>
            )}
            {cardStep >= 1 && (
              <motion.div
                key="c2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="bg-gradient-to-r from-positive/20 to-positive/5 border border-positive/15 rounded-lg md:rounded-xl p-1.5 md:p-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[6px] md:text-[8px] font-semibold text-positive/80">Алина</p>
                    <p className="text-[9px] md:text-xs font-black text-positive">+3 200 ₸</p>
                  </div>
                  <div className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-positive/20 flex items-center justify-center text-[5px] md:text-[7px] font-bold text-positive">A</div>
                </div>
              </motion.div>
            )}
            {cardStep >= 2 && (
              <motion.div
                key="c3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="bg-gradient-to-r from-negative/20 to-negative/5 border border-negative/15 rounded-lg md:rounded-xl p-1.5 md:p-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[6px] md:text-[8px] font-semibold text-negative/80">Ержан</p>
                    <p className="text-[9px] md:text-xs font-black text-negative">-2 000 ₸</p>
                  </div>
                  <div className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-negative/20 flex items-center justify-center text-[5px] md:text-[7px] font-bold text-negative">E</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom nav */}
        <div className="flex justify-around py-1 md:py-1.5 border-t border-border/20">
          {["Главная", "Аналитика", "Профиль"].map((tab, i) => (
            <div
              key={tab}
              className={`text-[5px] md:text-[6px] font-medium ${
                i === 0 ? "text-positive" : "text-muted-foreground/40"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Slide 1: Hero ─────────────────────────────────────────

function HeroSection({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-4 sm:py-6">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/10 text-xs text-primary font-medium mb-3 sm:mb-4"
      >
        <Smartphone className="w-3.5 h-3.5" />
        Не требует App Store
      </motion.div>

      {/* Phone area */}
      <div className="relative mb-2 sm:mb-4">
        <HeroPhone />
        <FloatingStats />
      </div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-[1.15] text-center max-w-md"
      >
        Не теряй деньги{" "}
        <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
          в чатах
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-sm text-center mt-2"
      >
        5 секунд на запись. Никаких таблиц.
      </motion.p>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-2 mt-3 sm:mt-4"
      >
        {["Работает офлайн", "Меньше 1 МБ", "Бесплатно"].map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-full bg-muted/50 border border-border/30 text-[11px] font-medium text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-5 sm:mt-6 w-full max-w-xs"
      >
        <Button
          size="lg"
          className="w-full h-12 px-7 rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 relative overflow-hidden group"
          onClick={onNext}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          Начать
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Slide 2: Video Tutorial ───────────────────────────────
// YouTube Shorts — установка на экран

const VIDEO_ID = "d8rGG0uDbdc";
const THUMB_URL = `https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`;
const EMBED_URL = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

function VideoSlide({ onFinish }: { onFinish: () => void }) {
  const [watching, setWatching] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        {/* Badge */}
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.05,
            type: "spring",
            damping: 18,
            stiffness: 180,
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/10 text-[10px] text-primary font-medium tracking-wider uppercase mb-4"
        >
          <Smartphone className="w-3 h-3" />
          Как установить
        </motion.span>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-xl sm:text-2xl font-black tracking-tight mb-1"
        >
          На экран за 10 секунд
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-sm text-muted-foreground mb-5 max-w-xs"
        >
          Короткое видео — просто повтори
        </motion.p>

        {/* Video — превью сразу, плеер только по нажатию */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative w-full max-w-[200px] sm:max-w-[240px] md:max-w-[260px]"
        >
          {!watching ? (
            <button
              onClick={() => setWatching(true)}
              className="relative w-full block rounded-2xl overflow-hidden bg-muted/40 border border-border/20 shadow-lg shadow-black/5 group"
            >
              <img
                src={THUMB_URL}
                alt="Превью видео"
                className="w-full aspect-[9/16] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] transition-all group-hover:bg-black/15">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 shadow-xl flex items-center justify-center"
                >
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 text-foreground ml-0.5 fill-foreground transition-transform group-hover:scale-110" />
                </motion.div>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl overflow-hidden bg-black border border-border/20 shadow-lg shadow-black/5">
              <iframe
                src={EMBED_URL}
                className="w-full aspect-[9/16]"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Как установить Qaryz на экран"
              />
            </div>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-[11px] text-muted-foreground/40 mt-3 mb-6"
        >
          {watching ? "Видео с YouTube · без рекламы" : "Нажми, чтобы посмотреть"}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="w-full max-w-xs"
        >
          <Button
            size="lg"
            className="w-full h-12 px-7 rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 relative overflow-hidden group"
            onClick={onFinish}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            Войти и начать
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <p className="mt-3 text-[11px] text-muted-foreground/40">
            Бесплатно. Без рекламы. Честно.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const authState = useAuthStore((s) => s.state);
  const [slide, setSlide] = useState<"hero" | "video">("hero");

  useEffect(() => {
    if (authState === "authenticated") navigate("/", { replace: true });
  }, [authState, navigate]);

  if (authState === "loading") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background relative overflow-hidden">
      {/* Animated gradient bg */}
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

      <Particles count={10} />

      {/* Decorative blurs */}
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="fixed -bottom-40 -left-40 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px]" />

      {/* Slides */}
      <div className="relative z-10 min-h-dvh">
        <AnimatePresence mode="wait">
          {slide === "hero" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="min-h-dvh flex flex-col"
            >
              <div className="shrink-0 px-6 pt-4 sm:pt-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-black text-primary">Q</span>
                  </div>
                  <span className="text-sm font-bold text-foreground/40">Qaryz</span>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <HeroSection onNext={() => setSlide("video")} />
              </div>
            </motion.div>
          )}

          {slide === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="min-h-dvh flex flex-col"
            >
              <div className="shrink-0 px-6 pt-4 sm:pt-5 flex items-center justify-between">
                <button
                  onClick={() => setSlide("hero")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  Назад
                </button>
                <span className="text-[10px] font-bold text-foreground/30">Qaryz</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <VideoSlide onFinish={() => navigate("/auth")} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
