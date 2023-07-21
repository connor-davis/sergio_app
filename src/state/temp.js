import { create } from "zustand";

export const useTemp = create((set, get) => ({
  schedules: [],
  shifts: [],
  teachers: [],
  addSchedule: (schedule) =>
    set((state) => ({ ...state, schedules: [...state.schedules, schedule] })),
  addShift: (shift) =>
    set((state) => ({ ...state, shifts: [...state.shifts, shift] })),
  addTeacher: (teacher) =>
    set((state) => ({ ...state, teachers: [...state.teachers, teacher] })),
  addSchedules: (schedules) =>
    set((state) => ({
      ...state,
      schedules: [...state.schedules, ...schedules],
    })),
  addShifts: (shifts) =>
    set((state) => ({ ...state, shifts: [...state.shifts, ...shifts] })),
  addTeachers: (teachers) =>
    set((state) => ({ ...state, teachers: [...state.teachers, ...teachers] })),
  setSchedules: (schedules) => set((state) => ({ ...state, schedules })),
  setShifts: (shifts) => set((state) => ({ ...state, shifts })),
  clearTemp: () =>
    set((state) => ({ schedules: [], shifts: [], teachers: [] })),
}));
