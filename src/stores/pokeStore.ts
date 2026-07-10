import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PokeStore {
  /** personId → ISO date string (YYYY-MM-DD) marking last poke */
  pokedToday: Record<string, string>;

  /** Returns true if the person hasn't been poked today */
  canPoke: (personId: string) => boolean;

  /** Records a poke for today. No-op if already poked. */
  poke: (personId: string) => void;
}

export const usePokeStore = create<PokeStore>()(
  persist(
    (set, get) => ({
      pokedToday: {},

      canPoke(personId: string) {
        const today = new Date().toISOString().slice(0, 10);
        return get().pokedToday[personId] !== today;
      },

      poke(personId: string) {
        const today = new Date().toISOString().slice(0, 10);
        const already = get().pokedToday[personId] === today;
        if (already) return;
        set({ pokedToday: { ...get().pokedToday, [personId]: today } });
      },
    }),
    {
      name: "qaryz-pokes",
      version: 1,
      partialize: (state) => ({ pokedToday: state.pokedToday }),
    }
  )
);
