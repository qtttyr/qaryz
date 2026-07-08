import { useEffect } from "react";
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

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync data from Supabase when user authenticates
  useEffect(() => {
    if (authState === "authenticated") {
      syncFromSupabase();
    }
  }, [authState, syncFromSupabase]);

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
