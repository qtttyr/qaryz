import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePokeStore } from "@/stores/pokeStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/shared/Toast";
import { cn } from "@/lib/utils";

interface NudgeButtonProps {
  personId: string;
  personName: string;
  /** "icon" — compact inline (PersonCard), "button" — large prominent (FriendProfilePage) */
  variant?: "icon" | "button";
}

type NudgeState = "idle" | "poking" | "done";

export default function NudgeButton({ personId, personName, variant = "icon" }: NudgeButtonProps) {
  const [state, setState] = useState<NudgeState>("idle");
  const [pokedToday, setPokedToday] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return usePokeStore.getState().pokedToday[personId] === today;
  });
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const isInteractive = !pokedToday && state === "idle";

  const handlePoke = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const store = usePokeStore.getState();
      if (!store.canPoke(personId) || state !== "idle") return;

      // Record poke in store
      store.poke(personId);

      // Start animation
      setState("poking");
      setPokedToday(true);

      // Toast
      showToast(`👉 Тыкнул(а) ${personName}`, "info");

      // Push notification
      const user = useAuthStore.getState().user;
      if (user) {
        supabase.functions.invoke("nudge", {
          body: { targetUserId: personId },
        }).catch((err) => {
          console.error("nudge function call failed:", err);
        });
      }

      // Animation timeline
      cooldownRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setState("done");
        cooldownRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          setState("idle");
        }, 2200);
      }, 400);
    },
    [personId, personName, state],
  );

  // ── "button" variant — large, prominent ──
  if (variant === "button") {
    if (pokedToday && state === "idle") {
      return (
        <button
          type="button"
          disabled
          title="Уже тыкнуто сегодня"
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl",
            "text-base font-semibold bg-muted/50 text-muted-foreground/40 cursor-not-allowed",
            "border border-border/30 transition-all duration-200"
          )}
        >
          <span className="text-xl opacity-40" style={{ rotate: "-18deg" }}>👉</span>
          Уже тыкнуто
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handlePoke}
        disabled={!isInteractive}
        className={cn(
          "flex-1 relative inline-flex items-center justify-center gap-2.5 h-12 px-5 rounded-xl",
          "text-base font-semibold transition-all duration-200 select-none overflow-hidden",
          "border",
          state === "idle" &&
            "bg-card border-primary/20 text-foreground hover:bg-primary/5 hover:border-primary/40 hover:shadow-sm active:scale-[0.98]",
          state === "poking" && "scale-[0.98] border-primary/30 bg-primary/5",
          state === "done" && "border-primary/30 bg-primary/5 text-primary",
        )}
      >
        {/* Ripple */}
        <AnimatePresence>
          {state === "poking" && (
            <motion.span
              key="ripple-btn"
              initial={{ opacity: 0.3, scale: 0.5 }}
              animate={{ opacity: 0, scale: 2.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 rounded-xl bg-primary/15"
              aria-hidden
            />
          )}
        </AnimatePresence>

        {/* Emoji */}
        <motion.span
          key={`emoji-btn-${state}`}
          initial={{ rotate: -18, scale: 1 }}
          animate={
            state === "poking"
              ? { rotate: [-18, -35, 10, -18], scale: [1, 1.4, 0.9, 1] }
              : { rotate: -18, scale: 1 }
          }
          transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          className="inline-block text-xl"
          style={{ rotate: "-18deg" }}
        >
          👉
        </motion.span>

        <span>{state === "done" ? "Тыкнуто!" : "Тыкнуть"}</span>
      </button>
    );
  }

  // ── "icon" variant — compact inline ──

  if (pokedToday && state === "idle") {
    return (
      <span
        title="Уже тыкнуто сегодня"
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl cursor-not-allowed"
      >
        <span className="inline-block text-lg select-none opacity-20" style={{ rotate: "-18deg" }}>
          👉
        </span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePoke}
      disabled={!isInteractive}
      title={state === "done" ? "Тыкнуто!" : "Тыкнуть"}
      className={cn(
        "relative inline-flex items-center justify-center w-9 h-9 rounded-xl",
        "transition-all duration-200 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1",
        state === "idle" &&
          "hover:bg-primary/10 hover:scale-110 active:scale-90",
        state === "poking" && "scale-125",
        state === "done" && "text-primary"
      )}
    >
      {/* Glow ripple */}
      <AnimatePresence>
        {state === "poking" && (
          <motion.span
            key="ripple-icon"
            initial={{ opacity: 0.4, scale: 0.6 }}
            animate={{ opacity: 0, scale: 2.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute inset-0 rounded-xl bg-primary/20"
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Emoji */}
      <motion.span
        key={`emoji-icon-${state}`}
        initial={{ rotate: -18, scale: 1 }}
        animate={
          state === "poking"
            ? { rotate: [-18, -30, 10, -18], scale: [1, 1.4, 0.9, 1] }
            : { rotate: -18, scale: 1 }
        }
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        className="inline-block text-lg"
        style={{ rotate: "-18deg" }}
      >
        👉
      </motion.span>
    </button>
  );
}
