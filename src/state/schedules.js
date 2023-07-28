import { v4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { indexedDbStorage } from "./indexedDb";

export const useSchedules = create(
  persist(
    (set, get) => ({
      schedules: [],
      setSchedules: (schedules) => set((state) => ({ schedules })),
      clearSchedules: () => set((state) => ({ schedules: [] })),
    }),
    {
      name: "schedules-storage",
      storage: createJSONStorage(() => indexedDbStorage("schedules-storage")),
    }
  )
);
