import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useUIStore } from "./stores/uiStore";
import { useAuthStore } from "./stores/authStore";
import { useDebtStore } from "./stores/debtStore";
import { ToastContainer } from "@/components/shared/Toast";

function App() {
  const theme = useUIStore((s) => s.theme);
  const initialize = useAuthStore((s) => s.initialize);
  const authState = useAuthStore((s) => s.state);
  const setData = useDebtStore((s) => s.setData);

  // Initialize auth on mount — authStore handles syncing internally
  useEffect(() => {
    initialize();
  }, [initialize]);

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

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}

export default App;
