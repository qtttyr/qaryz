import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConsentStore {
  /** Был ли показан баннер согласия на localStorage */
  cookieBannerShown: boolean;
  /** Принял ли пользователь соглашение (чекбокс при регистрации) */
  termsAccepted: boolean;
  /** Версия принятой Политики */
  acceptedPolicyVersion: string;
  /** Дата согласия */
  consentDate: string | null;
  /** Текущая версия Политики (для сравнения) */
  currentPolicyVersion: string;

  setCookieBannerShown: () => void;
  acceptTerms: (policyVersion: string) => void;
  hasAcceptedCurrentVersion: () => boolean;
  resetConsent: () => void;
}

export const useConsentStore = create<ConsentStore>()(
  persist(
    (set, get) => ({
      cookieBannerShown: false,
      termsAccepted: false,
      acceptedPolicyVersion: "",
      consentDate: null,
      currentPolicyVersion: "2026-07-24",

      setCookieBannerShown: () => set({ cookieBannerShown: true }),

      acceptTerms: (policyVersion: string) =>
        set({
          termsAccepted: true,
          acceptedPolicyVersion: policyVersion,
          consentDate: new Date().toISOString(),
        }),

      hasAcceptedCurrentVersion: () => {
        const state = get();
        return (
          state.termsAccepted &&
          state.acceptedPolicyVersion === state.currentPolicyVersion
        );
      },

      resetConsent: () =>
        set({
          termsAccepted: false,
          acceptedPolicyVersion: "",
          consentDate: null,
          cookieBannerShown: false,
        }),
    }),
    {
      name: "qaryz-consent",
      version: 1,
      partialize: (state) => ({
        cookieBannerShown: state.cookieBannerShown,
        termsAccepted: state.termsAccepted,
        acceptedPolicyVersion: state.acceptedPolicyVersion,
        consentDate: state.consentDate,
      }),
    }
  )
);
