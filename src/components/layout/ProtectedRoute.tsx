import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "framer-motion";

const supabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== "https://placeholder.supabase.co" &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== "placeholder";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto"
        >
          <span className="text-3xl font-black text-primary">Q</span>
        </motion.div>
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useAuthStore((s) => s.state);

  useEffect(() => {
    // If Supabase is not configured, allow access without auth
    if (!supabaseConfigured) return;

    // If not on auth page and not authenticated, redirect
    if (state === "unauthenticated" && location.pathname !== "/auth") {
      navigate("/auth", { replace: true });
    }

    // If on auth page and already authenticated, redirect to home
    if (state === "authenticated" && location.pathname === "/auth") {
      navigate("/", { replace: true });
    }
  }, [state, navigate, location.pathname]);

  // Show loading while auth initializes
  if (supabaseConfigured && state === "loading") {
    return <LoadingScreen />;
  }

  // If on auth page, don't wrap with layout
  if (location.pathname === "/auth") {
    return <>{children}</>;
  }

  // If not authenticated and Supabase is configured, show nothing (redirecting)
  if (supabaseConfigured && state === "unauthenticated") {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
