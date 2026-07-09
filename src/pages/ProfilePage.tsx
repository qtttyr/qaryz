import { useState, useEffect } from "react";
import { useUserStore } from "@/stores/userStore";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useDebtStore } from "@/stores/debtStore";
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
  CallIcon,
  UserIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { Separator } from "@/components/ui/separator";
import AvatarUpload from "@/components/shared/AvatarUpload";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Share2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import PushSetupBanner from "@/components/notifications/PushSetupBanner";
import { Notification02Icon } from "@hugeicons/core-free-icons";
import { showToast } from "@/components/shared/Toast";

export default function ProfilePage() {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const resetProfile = useUserStore((s) => s.resetProfile);

  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const authUpdateProfile = useAuthStore((s) => s.updateProfile);
  const navigate = useNavigate();

  const debts = useDebtStore((s) => s.debts);
  const payments = useDebtStore((s) => s.payments);
  const people = useDebtStore((s) => s.people);

  const isAuthenticated = !!user;

  // Local state for editable fields
  const [localName, setLocalName] = useState(profile.name);
  const [localUsername, setLocalUsername] = useState(profile.username);
  const [localPhone, setLocalPhone] = useState(profile.phone || "");

  // Sync local state when profile loads
  useEffect(() => {
    setLocalName(profile.name);
    setLocalUsername(profile.username);
    setLocalPhone(profile.phone || "");
  }, [profile.name, profile.username, profile.phone]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stats
  const totalPeople = people.length;
  const totalDebts = debts.filter((d) => !d.settledAt).length;
  let balance = 0;
  for (const d of debts) {
    if (d.settledAt) continue;
    const paid = payments.filter((p) => p.debtId === d.id).reduce((s, p) => s + p.amount, 0);
    balance += d.direction === "owed_to_me" ? (d.amount - paid) : -(d.amount - paid);
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const saveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaveSuccess(false);

    updateProfile({ name: localName, username: localUsername, phone: localPhone || undefined });

    await authUpdateProfile(user.id, {
      name: localName,
      username: localUsername,
      phone: localPhone || undefined,
    });

    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const profileLink = `${window.location.origin}/add-friend?user=${user?.id || ""}`;

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Мой профиль в Qaryz`,
          text: `Добавляй меня в друзья в Qaryz: @${profile.username}`,
          url: profileLink,
        });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileLink);
      } catch {
        // ignore
      }
    }
  };

  const syncStatus = useDebtStore((s) => s.syncStatus);
  const syncFromSupabase = useDebtStore((s) => s.syncFromSupabase);

  // ── Push Notifications ──
  const {
    permission: pushPermission,
    subscribed: pushSubscribed,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    loading: pushLoading,
    supported: pushSupported,
  } = usePushNotifications();

  const [pushBannerDismissed, setPushBannerDismissed] = useState(
    () => localStorage.getItem("qaryz-push-banner-dismissed") === "true"
  );

  const showPushBanner = pushSupported && !pushSubscribed && !pushBannerDismissed && pushPermission !== "denied";

  const handlePushSubscribe = async () => {
    const ok = await pushSubscribe();
    if (ok) {
      showToast("🔔 Уведомления включены", "success");
    } else {
      showToast("Не удалось включить уведомления", "error");
    }
  };

  const handlePushUnsubscribe = async () => {
    await pushUnsubscribe();
    showToast("Уведомления отключены", "info");
  };

  const handleDismissBanner = () => {
    setPushBannerDismissed(true);
    localStorage.setItem("qaryz-push-banner-dismissed", "true");
  };

  return (
    <PullToRefresh onRefresh={syncFromSupabase} disabled={syncStatus === "syncing"}>
    <div className="space-y-8 pb-10">
      {/* Push notification setup banner */}
      <div className="px-4">
        <PushSetupBanner
          visible={showPushBanner}
          subscribed={pushSubscribed}
          permission={pushPermission}
          loading={pushLoading}
          supported={pushSupported}
          onEnable={handlePushSubscribe}
          onDisable={handlePushUnsubscribe}
          onDismiss={handleDismissBanner}
        />
      </div>
      {/* Profile Header — Instagram style */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AvatarUpload
            currentUrl={profile.avatar}
            name={profile.name}
            size="xl"
            onUpdate={async (url) => {
              // Local optimisitic update
              updateProfile({ avatar: url });
              // Persist to Supabase via authStore (includes profiles table)
              if (user?.id) {
                await authUpdateProfile(user.id, {
                  avatar_url: url ?? null,
                });
              }
            }}
          />
        </motion.div>

        <h1 className="text-xl font-bold mt-4">{profile.name}</h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>

        {isAuthenticated && user?.email && (
          <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
            <HugeiconsIcon icon={Mail01Icon} size={12} />
            {user.email}
          </p>
        )}

        {profile.phone && (
          <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-1">
            <HugeiconsIcon icon={CallIcon} size={12} />
            {profile.phone}
          </p>
        )}

        {/* Share profile */}
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={shareProfile} className="gap-1.5 text-xs">
            <Share2 className="w-3.5 h-3.5" /> Поделиться профилем
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mx-4 flex justify-around py-3 px-2 rounded-2xl bg-card border border-border/50">
        <div className="text-center">
          <p className="text-lg font-bold">{totalPeople}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Людей</p>
        </div>
        <div className="w-px bg-border/50" />
        <div className="text-center">
          <p className="text-lg font-bold">{totalDebts}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Активных</p>
        </div>
        <div className="w-px bg-border/50" />
        <div className="text-center">
          <p className={cn(
            "text-lg font-bold",
            balance > 0 ? "text-emerald-500" : balance < 0 ? "text-red-500" : ""
          )}>
            {balance > 0 ? "+" : ""}{balance.toLocaleString()} ₸
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Баланс</p>
        </div>
      </div>

      {/* Edit Profile Section */}
      <section className="px-4 space-y-4">
        <div className="grid gap-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Имя</label>
            <div className="relative">
              <Input
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="h-11 rounded-xl bg-card border-border/50 pl-9"
              />
              <HugeiconsIcon icon={UserIcon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            </div>
          </div>

          {/* Username (always editable for now) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">@username</label>
            <Input
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value.replace(/\s/g, ""))}
              className="h-11 rounded-xl bg-card border-border/50"
              placeholder="username"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Телефон</label>
            <div className="relative">
              <Input
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
                className="h-11 rounded-xl bg-card border-border/50 pl-9"
                placeholder="+7 777 000 00 00"
              />
              <HugeiconsIcon icon={CallIcon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            </div>
          </div>

          {/* Save button */}
          <div className="flex gap-2">
            <Button
              onClick={saveProfile}
              disabled={saving}
              className="flex-1 h-11 rounded-xl gap-1.5"
            >
              {saving ? "Сохранение..." : saveSuccess ? (
                <><HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} /> Сохранено</>
              ) : "Сохранить"}
            </Button>
          </div>
        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* App Settings */}
      <section className="px-4 space-y-6">
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

      {pushSupported && (
        <>
          <Separator className="bg-border/50" />

          {/* Push Notifications Settings */}
          <section className="px-4 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <HugeiconsIcon icon={Notification02Icon} size={18} className="text-primary" />
              Уведомления
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Push-уведомления</p>
                <p className="text-xs text-muted-foreground">
                  {pushSubscribed
                    ? "Напоминания о долгах приходят даже когда приложение закрыто"
                    : "Получайте уведомления о новых долгах и платежах"}
                </p>
              </div>
              <Button
                size="sm"
                variant={pushSubscribed ? "outline" : "default"}
                className="h-9 rounded-lg text-xs gap-1.5"
                onClick={pushSubscribed ? handlePushUnsubscribe : handlePushSubscribe}
                disabled={pushLoading}
              >
                {pushLoading ? (
                  <span className="animate-pulse">...</span>
                ) : pushSubscribed ? (
                  "Отключить"
                ) : (
                  <>
                    <HugeiconsIcon icon={Notification02Icon} size={14} />
                    Включить
                  </>
                )}
              </Button>
            </div>
          </section>
        </>
      )}

      <Separator className="bg-border/50" />

      {/* Auth section */}
      <section className="px-4 space-y-4">
        {isAuthenticated ? (
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <HugeiconsIcon icon={Logout01Icon} size={18} />
            Выйти из аккаунта
          </Button>
        ) : (
          <Button
            className="w-full h-12 rounded-xl gap-2"
            onClick={() => navigate("/auth")}
          >
            <HugeiconsIcon icon={Logout01Icon} size={18} />
            Войти в аккаунт
          </Button>
        )}

        {/* Danger Zone */}
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

        <p className="text-[10px] text-center text-muted-foreground pt-2">
          Версия 1.0.0-alpha • Сделано с любовью
        </p>
      </section>
    </div>
    </PullToRefresh>
  );
}

