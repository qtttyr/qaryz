import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Play } from "lucide-react";
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
    <div className="relative mx-auto w-[180px] h-[380px] sm:w-[220px] sm:h-[450px] rounded-[2.5rem] border-4 border-white/10 bg-gradient-to-b from-background to-muted/80 shadow-2xl shadow-black/30 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-white/10 rounded-b-2xl z-10" />
      <div className="absolute inset-0 pt-7 pb-3 px-2.5 flex flex-col gap-2">
        <div className="flex justify-between items-center px-1 text-[8px] text-muted-foreground/60 font-medium">
          <span>9:41</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-1.5 rounded-sm bg-muted-foreground/40" />
          </div>
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
              <motion.div
                key="c1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="bg-gradient-to-r from-positive/20 to-positive/5 border border-positive/15 rounded-xl p-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-semibold text-positive/80">Айбек</p>
                    <p className="text-xs font-black text-positive">+5 000 ₸</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-positive/20 flex items-center justify-center text-[7px] font-bold text-positive">A</div>
                </div>
              </motion.div>
            )}
            {cardStep >= 1 && (
              <motion.div
                key="c2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="bg-gradient-to-r from-positive/20 to-positive/5 border border-positive/15 rounded-xl p-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-semibold text-positive/80">Алина</p>
                    <p className="text-xs font-black text-positive">+3 200 ₸</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-positive/20 flex items-center justify-center text-[7px] font-bold text-positive">A</div>
                </div>
              </motion.div>
            )}
            {cardStep >= 2 && (
              <motion.div
                key="c3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="bg-gradient-to-r from-negative/20 to-negative/5 border border-negative/15 rounded-xl p-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-semibold text-negative/80">Ержан</p>
                    <p className="text-xs font-black text-negative">-2 000 ₸</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-negative/20 flex items-center justify-center text-[7px] font-bold text-negative">E</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex justify-around py-1.5 border-t border-border/20">
          {["Главная", "Аналитика", "Профиль"].map((tab, i) => (
            <div key={tab} className={`text-[6px] font-medium ${i === 0 ? "text-positive" : "text-muted-foreground/40"}`}>
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
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
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
        transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
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
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-sm text-center mt-2"
      >
        5 секунд на запись. Никаких таблиц.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-2 mt-3 sm:mt-4"
      >
        {["Работает офлайн", "Меньше 1 МБ", "Бесплатно"].map((tag) => (
          <span key={tag} className="px-2.5 py-1 rounded-full bg-muted/50 border border-border/30 text-[11px] font-medium text-muted-foreground">
            {tag}
          </span>
        ))}
      </motion.div>

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
// Замени URL ниже на свои видео после съёмки.
// Положи файлы в public/videos/ или залей на YouTube/Vimeo.

const VIDEOS = {
  ios: "/videos/install-ios.mp4",
  android: "/videos/install-android.mp4",
};

function VideoSlide({ onFinish }: { onFinish: () => void }) {
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (/android/i.test(navigator.userAgent)) setPlatform("android");
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        {/* Label */}
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, type: "spring", damping: 18, stiffness: 180 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/10 text-[10px] text-primary font-medium tracking-wider uppercase mb-4"
        >
          <Smartphone className="w-3 h-3" />
          Как установить
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-xl sm:text-2xl font-black tracking-tight mb-1"
        >
          На экран за 10 секунд
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-sm text-muted-foreground mb-5 max-w-xs"
        >
          Короткое видео — просто повтори
        </motion.p>

        {/* Platform toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center gap-1.5 mb-5 bg-muted/50 p-1 rounded-xl"
        >
          {(["ios", "android"] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setPlatform(p); setPlaying(false); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                platform === p
                  ? "bg-card text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              {p === "ios" ? "iPhone" : "Android"}
            </button>
          ))}
        </motion.div>

        {/* Video player */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="relative w-full max-w-[260px] rounded-2xl overflow-hidden bg-muted/40 border border-border/20 shadow-lg shadow-black/5"
        >
          <video
            ref={videoRef}
            key={platform}
            src={VIDEOS[platform]}
            preload="metadata"
            playsInline
            controls={playing}
            className="w-full aspect-[9/19] object-cover bg-black/5"
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          />

          {!playing && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px] transition-opacity hover:bg-black/15"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-white/90 shadow-xl flex items-center justify-center group/btn"
              >
                <Play className="w-7 h-7 text-foreground ml-0.5 fill-foreground transition-transform group-hover/btn:scale-110" />
              </motion.div>
            </button>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-[11px] text-muted-foreground/40 mt-3 mb-6"
        >
          Видео загружается только по нажатию
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
      {/* Animated background */}
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
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="fixed -bottom-40 -left-40 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px]" />

      {/* Slides */}
      <AnimatePresence mode="wait">
        {slide === "hero" && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 flex flex-col"
          >
            <div className="px-6 pt-4 sm:pt-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-black text-primary">Q</span>
                </div>
                <span className="text-sm font-bold text-foreground/40">Qaryz</span>
              </div>
            </div>
            <HeroSection onNext={() => setSlide("video")} />
          </motion.div>
        )}

        {slide === "video" && (
          <motion.div
            key="video"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 flex flex-col"
          >
            <div className="px-6 pt-4 sm:pt-5 flex items-center justify-between">
              <button
                onClick={() => setSlide("hero")}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                Назад
              </button>
              <span className="text-[10px] font-bold text-foreground/30">Qaryz</span>
            </div>
            <VideoSlide onFinish={() => navigate("/auth")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
