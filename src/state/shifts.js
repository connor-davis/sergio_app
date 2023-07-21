import { v4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { indexedDbStorage } from "./indexedDb";

export const useShifts = create(
  persist(
    (set, get) => ({
      shifts: [],
      addShift: (data) =>
        set((state) => ({
          ...state,
          shifts: [
            ...new Map(
              state.shifts.map((shift) => [
                `${shift["Shift"]}-${shift["Name"]}`,
                shift,
              ])
            ).values(),
            data,
          ],
        })),
      removeShifts: (shift) =>
        set((state) => ({
          ...state,
          shifts: state.shifts.filter(
            (schedule) => schedule["Shift"] !== shift
          ),
        })),
      clearShifts: () => set((state) => ({ shifts: [] })),
    }),
    {
      name: "shifts-storage",
      storage: createJSONStorage(() => indexedDbStorage("shifts-storage")),
    }
  )
);
