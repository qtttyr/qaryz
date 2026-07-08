import { useUserStore } from "@/stores/userStore";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoonIcon,
  Sun01Icon,
  GlobalIcon,
  Logout01Icon,
  Delete02Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { Separator } from "@/components/ui/separator";
import AvatarUpload from "@/components/shared/AvatarUpload";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const resetProfile = useUserStore((s) => s.resetProfile);

  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
        <p className="text-muted-foreground">Настройки приложения и аккаунта</p>
      </header>

      {/* User Info Section */}
      <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5"
        >
          <AvatarUpload
            currentUrl={profile.avatar}
            name={isAuthenticated ? (user?.user_metadata?.name as string) || profile.name : profile.name}
            size="xl"
            onUpdate={(url) => {
              updateProfile({ avatar: url });
              // Persist to Supabase profiles table so it survives logout
              if (user?.id) {
                supabase.from("profiles").upsert({ id: user.id, avatar_url: url }).then();
              }
            }}
          />
          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="text-xl font-bold truncate">
              {isAuthenticated ? (user?.user_metadata?.name as string) || profile.name : profile.name}
            </h2>
            {isAuthenticated && user?.email && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <HugeiconsIcon icon={Mail01Icon} size={14} />
                {user.email}
              </p>
            )}
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            )}
          </div>
        </motion.div>

        {/* Auth Section */}
        {isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card border border-border/50 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Аккаунт</p>
                <p className="text-xs text-muted-foreground">Вы вошли через Supabase</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-positive animate-pulse" />
            </div>
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <HugeiconsIcon icon={Logout01Icon} size={18} />
              Выйти из аккаунта
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card border border-border/50 p-4"
          >
            <p className="text-sm text-muted-foreground text-center">
              Данные хранятся локально на устройстве.
            </p>
          </motion.div>
        )}

        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
              Имя
            </label>
            <Input
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              className="h-11 rounded-xl bg-card border-border/50"
            />
          </div>
          {!isAuthenticated && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                Username
              </label>
              <Input
                value={profile.username}
                onChange={(e) => updateProfile({ username: e.target.value })}
                className="h-11 rounded-xl bg-card border-border/50"
              />
            </div>
          )}
        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* App Settings Section */}
      <section className="space-y-6">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <HugeiconsIcon icon={GlobalIcon} size={18} className="text-primary" />
          Приложение
        </h3>

        <div className="grid gap-6">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Тема оформления</p>
              <p className="text-xs text-muted-foreground">Тёмная или светлая</p>
            </div>
            <div className="flex bg-muted p-1 rounded-lg">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-md transition-all ${
                  theme === "light"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <HugeiconsIcon icon={Sun01Icon} size={16} />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-md transition-all ${
                  theme === "dark"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <HugeiconsIcon icon={MoonIcon} size={16} />
              </button>
            </div>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Валюта</p>
              <p className="text-xs text-muted-foreground">Основная валюта учёта</p>
            </div>
            <Select
              value={profile.currency}
              onValueChange={(val) => updateProfile({ currency: val })}
            >
              <SelectTrigger className="w-24 h-9 rounded-lg border-border/50 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                <SelectItem value="KZT">KZT (₸)</SelectItem>
                <SelectItem value="RUB">RUB (₽)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Язык</p>
              <p className="text-xs text-muted-foreground">Интерфейс приложения</p>
            </div>
            <Select
              value={profile.language}
              onValueChange={(val) => updateProfile({ language: val as "ru" | "en" })}
            >
              <SelectTrigger className="w-24 h-9 rounded-lg border-border/50 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* Danger Zone */}
      <section className="space-y-4">
        <Button
          variant="destructive"
          className="w-full h-12 rounded-xl gap-2 font-semibold opacity-60 hover:opacity-100 transition-opacity"
          onClick={() => {
            if (confirm("Вы уверены? Все данные будут удалены безвозвратно.")) {
              resetProfile();
              localStorage.clear();
              window.location.reload();
            }
          }}
        >
          <HugeiconsIcon icon={Delete02Icon} size={18} />
          Сбросить все данные
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">
          Версия 1.0.0-alpha • Сделано с любовью
        </p>
      </section>
    </div>
  );
}
