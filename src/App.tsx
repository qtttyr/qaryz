import { useEffect, useRef } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useUIStore } from "./stores/uiStore";
import { useAuthStore } from "./stores/authStore";
import { useDebtStore } from "./stores/debtStore";
import { useGroupStore } from "./stores/groupStore";
import { syncGroupSettlementsToDebts } from "@/lib/groupSettlementToDebt";
import { ToastContainer } from "@/components/shared/Toast";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { useSWUpdate } from "@/hooks/useSWUpdate";
import UpdateBanner from "@/components/notifications/UpdateBanner";
import CookieBanner from "@/components/legal/CookieBanner";

function App() {
  const theme = useUIStore((s) => s.theme);
  const initialize = useAuthStore((s) => s.initialize);
  const authState = useAuthStore((s) => s.state);
  const user = useAuthStore((s) => s.user);
  const setData = useDebtStore((s) => s.setData);
  const syncGroups = useGroupStore((s) => s.syncFromSupabase);
  const groupSyncStatus = useGroupStore((s) => s.syncStatus);
  const initialSyncDone = useRef(false);
  const groupDebtsSyncedRef = useRef(false);

  // Initialize auth on mount — authStore handles syncing internally
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync all data from Supabase when user becomes authenticated
  useEffect(() => {
    if (user && !initialSyncDone.current) {
      initialSyncDone.current = true;
      syncGroups();
    }
  }, [user, syncGroups]);

  // Reset sync flags when user logs out
  useEffect(() => {
    if (!user) {
      initialSyncDone.current = false;
      groupDebtsSyncedRef.current = false;
    }
  }, [user]);

  // Авто-синк: когда группа синхронизирована, проверить закрытые группы
  // и создать личные долги (для текущего устройства + кросс-устройств)
  useEffect(() => {
    if (groupSyncStatus === "synced" && user && !groupDebtsSyncedRef.current) {
      groupDebtsSyncedRef.current = true;
      syncGroupSettlementsToDebts();
    }
    // Сбрасываем флаг, если статус ушёл из "synced" (например, началась новая синхронизация)
    if (groupSyncStatus !== "synced") {
      groupDebtsSyncedRef.current = false;
    }
  }, [groupSyncStatus, user]);

  // Just logged out — clear local data immediately
  useEffect(() => {
    if (authState === "unauthenticated") {
      // Only clear when transitioning away from authenticated (not on initial unauthenticated)
      const debts = localStorage.getItem("qaryz-debts");
      if (debts) {
        localStorage.removeItem("qaryz-debts");
        localStorage.removeItem("qaryz-user");
        setData({ debts: [], payments: [], people: [] });
      }
    }
  }, [authState, setData]);

  // Apply theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Service worker update detection
  const { needsRefresh, update, dismiss } = useSWUpdate();

  return (
    <>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
      <ToastContainer />
      <UpdateBanner
        visible={needsRefresh}
        onUpdate={update}
        onDismiss={dismiss}
      />
      <CookieBanner />
    </>
  );
}

export default App;
