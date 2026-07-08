import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme } from "@/types/user";

interface UIStore {
  theme: Theme;
  sidebarOpen: boolean;
  activeModal: "none" | "add-debt" | "add-payment";
  activeModalData?: Record<string, unknown>;

  setTheme(theme: Theme): void;
  toggleTheme(): void;
  toggleSidebar(): void;
  openModal(
    modal: UIStore["activeModal"],
    data?: Record<string, unknown>
  ): void;
  closeModal(): void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: "light",
      sidebarOpen: false,
      activeModal: "none",
      activeModalData: undefined,

      setTheme(theme) {
        set({ theme });
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      toggleTheme() {
        set((state) => {
          const newTheme = state.theme === "dark" ? "light" : "dark";
          if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
          return { theme: newTheme };
        });
      },

      toggleSidebar() {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      openModal(modal, data) {
        set({ activeModal: modal, activeModalData: data });
      },

      closeModal() {
        set({ activeModal: "none", activeModalData: undefined });
      },
    }),
    {
      name: "qaryz-ui",
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
    }
  )
);
