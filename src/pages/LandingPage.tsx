import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification02Icon } from "@hugeicons/core-free-icons";
import { ArrowRight, Check, Smartphone, Share2, Plus, ExternalLink, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const authState = useAuthStore((s) => s.state);
  const [step, setStep] = useState<"hero" | "tutorial">("hero");
  const [installPlatform, setInstallPlatform] = useState<"ios" | "android">("ios");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) setInstallPlatform("android");
    else setInstallPlatform("ios");
  }, []);

  useEffect(() => {
    if (authState === "authenticated") {
      navigate("/", { replace: true });
    }
  }, [authState, navigate]);

  if (authState === "loading" || authState === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const goNext = () => setStep("tutorial");
  const goAuth = () => navigate("/auth");

  const tutorialSteps = installPlatform === "ios"
    ? [
        { icon: Share2, title: "Нажмите Share", desc: "В Safari нажмите «Поделиться» внизу экрана" },
        { icon: Plus, title: "На главный экран", desc: "Пролистайте вниз и выберите «На экран «Домой»" },
        { icon: ExternalLink, title: "Готово!", desc: "Иконка Qaryz появится как обычное приложение" },
      ]
    : [
        { icon: Share2, title: "Откройте меню", desc: "В Chrome нажмите три точки в правом верхнем углу" },
        { icon: Plus, title: "Добавить на экран", desc: "Выберите «Добавить на главный экран»" },
        { icon: ExternalLink, title: "Готово!", desc: "Иконка Qaryz появится на рабочем столе" },
      ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {step === "hero" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/10 text-xs text-primary font-medium mb-10"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Не требует App Store
              </motion.div>

              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="mb-6"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-[26px] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shadow-xl shadow-primary/5">
                  <span className="text-5xl font-black text-primary">Q</span>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] text-center mb-4"
              >
                Учёт долгов
                <br />
                <span className="text-primary">без App Store</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md text-center mt-3"
              >
                Лёгкое PWA-приложение для учёта долгов, совместных расходов и взаиморасчётов.
                Занимает <strong className="text-foreground">меньше 1 МБ</strong> и работает офлайн.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="mt-12 w-full max-w-xs"
              >
                <Button
                  size="lg"
                  className="w-full h-12 px-7 rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/20"
                  onClick={goNext}
                >
                  Начать
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>

              {/* Badge "Free" */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="mt-6 text-xs text-muted-foreground/50 text-center"
              >
                Бесплатно • Без рекламы • <span className="text-primary/70">Меньше 1 МБ</span>
              </motion.p>
            </motion.div>
          )}

          {step === "tutorial" && (
            <motion.div
              key="tutorial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center gap-2 mb-1"
              >
                <span className="text-[10px] uppercase tracking-widest font-medium text-primary">3 шага</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-2xl sm:text-3xl font-bold text-center mb-2"
              >
                Добавить на главный экран
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-muted-foreground text-center mb-10 text-sm"
              >
                И пользуйтесь Qaryz как обычным приложением
              </motion.p>

              {/* Platform toggle */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex justify-center mb-10"
              >
                <div className="inline-flex bg-muted p-0.5 rounded-lg">
                  <button
                    onClick={() => setInstallPlatform("ios")}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                      installPlatform === "ios"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    iPhone / iPad
                  </button>
                  <button
                    onClick={() => setInstallPlatform("android")}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                      installPlatform === "android"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    Android
                  </button>
                </div>
              </motion.div>

              {/* Steps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full max-w-md"
              >
                <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
                  {tutorialSteps.map((step, i) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.15, duration: 0.4 }}
                      className="relative text-center p-5 rounded-2xl bg-card border border-border/30"
                    >
                      {/* Step number */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.15, duration: 0.3, type: "spring", stiffness: 200 }}
                        className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mx-auto mb-4"
                      >
                        {i + 1}
                      </motion.div>

                      {/* Icon */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.15, duration: 0.3, type: "spring", stiffness: 200 }}
                        className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center"
                      >
                        <step.icon className="w-7 h-7 text-muted-foreground/70" />
                      </motion.div>

                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + i * 0.15, duration: 0.3 }}
                        className="text-sm font-semibold mb-1"
                      >
                        {step.title}
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.75 + i * 0.15, duration: 0.3 }}
                        className="text-xs text-muted-foreground leading-relaxed"
                      >
                        {step.desc}
                      </motion.p>
                    </motion.div>
                  ))}
                </div>

                {/* Final CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="mt-10 w-full"
                >
                  <Button
                    size="lg"
                    className="w-full h-12 px-7 rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/20"
                    onClick={goAuth}
                  >
                    Начать пользоваться
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <p className="mt-4 text-xs text-muted-foreground/50 text-center">
                    Бесплатно • Без рекламы • <span className="text-primary/70">Меньше 1 МБ</span>
                  </p>
                </motion.div>

                {/* Footer link */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="mt-6 text-center text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer"
                  onClick={goAuth}
                >
                  Уже есть аккаунт? Войти
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="px-6 py-6 border-t border-border/10">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
              <span className="font-bold text-foreground/30">Qaryz</span>
              <span className="text-[10px]">•</span>
              <span className="text-xs">v1.0.0-alpha</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}