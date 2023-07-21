import { v4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { indexedDbStorage } from "./indexedDb";

export const useTeachers = create(
  persist(
    (set, get) => ({
      teachers: [],
      addTeacher: (teacherName) =>
        set((state) => ({
          teachers: [
            ...state.teachers,
            {
              id: v4(),
              teacherName,
            },
          ],
        })),
      setTeachers: (teachers) => set((state) => ({ ...state, teachers })),
      removeTeacher: (id) =>
        set((state) => ({
          teachers: state.teachers.filter((teacher) => teacher.id !== id),
        })),
      clearTeachers: () => set((state) => ({ teachers: [] })),
    }),
    {
      name: "teachers-storage",
      storage: createJSONStorage(() => indexedDbStorage("teachers-storage")),
    }
  )
);
