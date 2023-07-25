import { v4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { indexedDbStorage } from "./indexedDb";

export const useSchedules = create(
  persist(
    (set, get) => ({
      schedules: {},
      lostSchedules: {},
      addSchedules: (day, data) =>
        set((state) => {
          let schedules = state.schedules;

          schedules[day] = data;

          return { ...state, schedules };
        }),
      addLostSchedules: (day, data) =>
        set((state) => {
          let lostSchedules = state.lostSchedules;

          lostSchedules[day] = data;

          return { ...state, lostSchedules };
        }),
      clearSchedules: () =>
        set((state) => ({ schedules: {}, lostSchedules: {} })),
    }),
    {
      name: "schedules-storage",
      storage: createJSONStorage(() => indexedDbStorage("schedules-storage")),
    }
  )
);
