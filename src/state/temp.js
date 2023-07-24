import { create } from "zustand";

export const useTemp = create((set, get) => ({
  selectedDate: Date.now(),
  setSelectedDate: (date) => set((state) => ({ ...state, selectedDate: date })),
  clearTemp: () => set((state) => ({ selectedDate: Date.now() })),
}));
