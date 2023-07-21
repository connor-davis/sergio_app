import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { indexedDbStorage } from "./indexedDb";

export const usePreferences = create(
  persist(
    (set, get) => ({
      preferences: {
        theme: "system",
      },
      setTheme: (theme) => set(() => ({ preferences: { theme } })),
    }),
    {
      name: "preferences-storage",
      storage: createJSONStorage(() => indexedDbStorage("preferences-storage")),
    }
  )
);
