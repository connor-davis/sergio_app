import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { indexedDbStorage } from "./indexedDb";
import { sortBy } from "../lib/utils";

export const useTeachers = create(
  persist(
    (set, get) => ({
      teachers: [],
      addTeacher: (teacherName) =>
        set((state) => {
          let teachers = state.teachers;

          if (
            !teachers
              .map(({ teacherName }) => teacherName)
              .includes(teacherName)
          )
            teachers.push({ teacherName });

          return { ...state, teachers };
        }),
      setTeachers: (teachers) => set((state) => ({ ...state, teachers })),
      addTeacherShift: (teacherName, shift) =>
        set((state) => {
          let teachers = state.teachers;

          if (
            !teachers
              .map(({ teacherName }) => teacherName)
              .includes(teacherName)
          )
            teachers.push({ teacherName });

          return {
            ...state,
            teachers: sortBy(
              teachers.map((teacher) => {
                if (teacher["teacherName"] === teacherName) {
                  const teachersShifts = teacher.shifts || [];

                  return {
                    ...teacher,
                    shifts: [
                      ...[
                        ...new Map(
                          teachersShifts.map((shift) => [
                            `${shift["Activity_Start_Time"]}-${shift["Activity_End_Time"]}-${shift["Shift_Name"]}`,
                            shift,
                          ])
                        ).values(),
                      ].filter(
                        (_shift) =>
                          `${_shift["Activity_Start_Time"]}-${_shift["Activity_End_Time"]}-${_shift["Shift_Name"]}` !==
                          `${shift["Activity_Start_Time"]}-${shift["Activity_End_Time"]}-${shift["Shift_Name"]}`
                      ),
                      shift,
                    ],
                  };
                } else return teacher;
              }),
              ["Name"]
            ),
          };
        }),
      removeTeacher: (teacherName) =>
        set((state) => ({
          teachers: state.teachers.filter(
            (teacher) => teacher.teacherName !== teacherName
          ),
        })),
      clearTeachers: () => set((state) => ({ teachers: [] })),
    }),
    {
      name: "teachers-storage",
      storage: createJSONStorage(() => indexedDbStorage("teachers-storage")),
    }
  )
);
