import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Money01Icon,
  ChartBarLineIcon,
  User03Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home01Icon;
}

const navItems: NavItem[] = [
  { path: "/", label: "Мне должны", icon: Home01Icon },
  { path: "/i-owe", label: "Я должен", icon: Money01Icon },
  { path: "/analytics", label: "Аналитика", icon: ChartBarLineIcon },
  { path: "/profile", label: "Профиль", icon: User03Icon },
];

interface BottomNavProps {
  variant?: "bottom" | "top";
}

export default function BottomNav({ variant = "bottom" }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  if (variant === "top") {
    return (
      <nav className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold bg-linear-to-r from-primary to-electric bg-clip-text text-transparent mr-4">
            Qaryz
          </span>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={18}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span>{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="topnav-pill"
                    className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-1 px-3 transition-colors duration-200 rounded-xl",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <HugeiconsIcon
                  icon={item.icon}
                  size={22}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                {active && (
                  <motion.div
                    layoutId="bottomnav-dot"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
