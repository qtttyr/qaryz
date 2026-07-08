import { useEffect, useRef } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useUIStore } from "./stores/uiStore";
import { useAuthStore } from "./stores/authStore";
import { useDebtStore } from "./stores/debtStore";

function App() {
  const theme = useUIStore((s) => s.theme);
  const initialize = useAuthStore((s) => s.initialize);
  const authState = useAuthStore((s) => s.state);
  const syncFromSupabase = useDebtStore((s) => s.syncFromSupabase);
  const setData = useDebtStore((s) => s.setData);
  const prevAuthState = useRef(authState);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle auth state changes: sync on login, clear on logout
  useEffect(() => {
    const prev = prevAuthState.current;
    prevAuthState.current = authState;

    // Just logged in
    if (authState === "authenticated" && prev === "unauthenticated") {
      syncFromSupabase();
    }

    // Just logged out — clear local data immediately
    if (authState === "unauthenticated" && prev === "authenticated") {
      localStorage.removeItem("qaryz-debts");
      localStorage.removeItem("qaryz-user");
      setData({ debts: [], payments: [], people: [] });
    }
  }, [authState, syncFromSupabase, setData]);

  // Apply theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return <RouterProvider router={router} />;
}

export default App;
