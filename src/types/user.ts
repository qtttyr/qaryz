export type Theme = "dark" | "light";

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  currency: string; // "KZT" | "RUB" | "USD"
  language: "ru" | "en";
}

export interface AppSettings {
  theme: Theme;
  autoReminders: boolean;
  aiTone: "neutral" | "friendly" | "formal";
  recurringReminders: boolean;
  notificationsEnabled: boolean;
}
