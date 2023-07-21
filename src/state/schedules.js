import { v4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { indexedDbStorage } from "./indexedDb";

export const useSchedules = create(
  persist(
    (set, get) => ({
      schedules: [],
      lostSchedules: [],
      addSchedule: (data) =>
        set((state) => ({
          schedules: [
            ...state.schedules.filter(
              (schedule) => schedule["Shift"] !== data["Shift"]
            ),
            data,
          ],
        })),
      removeSchedule: (shift) =>
        set((state) => ({
          schedules: state.schedules.filter(
            (schedule) => schedule["Shift"] !== shift
          ),
        })),
      addLostSchedule: (data) =>
        set((state) => ({
          lostSchedules: [
            ...state.lostSchedules.filter(
              (schedule) => schedule["Shift"] !== data["Shift"]
            ),
            data,
          ],
        })),
      removeLostSchedule: (shift) =>
        set((state) => ({
          lostSchedules: state.lostSchedules.filter(
            (schedule) => schedule["Shift"] !== shift
          ),
        })),
      clearSchedules: () =>
        set((state) => ({ schedules: [], lostSchedules: [] })),
    }),
    {
      name: "schedules-storage",
      storage: createJSONStorage(() => indexedDbStorage("schedules-storage")),
    }
  )
);
