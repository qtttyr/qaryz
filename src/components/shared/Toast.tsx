import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info";
}

let toastListeners: Array<(msg: ToastMessage) => void> = [];
let toastIdCounter = 0;

export function showToast(text: string, type: ToastMessage["type"] = "info") {
  const msg: ToastMessage = { id: String(++toastIdCounter), text, type };
  for (const listener of toastListeners) {
    listener(msg);
  }
  return msg.id;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      // Auto-remove after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 4000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm text-sm font-medium min-w-[280px] max-w-[400px]",
              toast.type === "error" &&
                "bg-red-600/90 text-white border border-red-500/30",
              toast.type === "success" &&
                "bg-emerald-600/90 text-white border border-emerald-500/30",
              toast.type === "info" &&
                "bg-foreground/90 text-background border border-foreground/10"
            )}
          >
            <span className="flex-1">{toast.text}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
