import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, AppSettings } from "@/types/user";

interface UserStore {
  profile: UserProfile;
  settings: AppSettings;

  updateProfile(partial: Partial<UserProfile>): void;
  updateSettings(partial: Partial<AppSettings>): void;
  resetProfile(): void;
}

const defaultProfile: UserProfile = {
  id: "default-user",
  name: "Пользователь",
  username: "user",
  currency: "KZT",
  language: "ru",
};

const defaultSettings: AppSettings = {
  theme: "dark",
  autoReminders: false,
  aiTone: "friendly",
  recurringReminders: false,
  notificationsEnabled: true,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      settings: defaultSettings,

      updateProfile(partial) {
        set((state) => ({
          profile: { ...state.profile, ...partial },
        }));
      },

      updateSettings(partial) {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }));
      },

      resetProfile() {
        set({ profile: defaultProfile, settings: defaultSettings });
      },
    }),
    {
      name: "qaryz-user",
    }
  )
);
