import { v4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { indexedDbStorage } from "./indexedDb";

export const useHistoricalFiles = create(
  persist(
    (set, get) => ({
      files: {},
      addFile: (filename, file) =>
        set((state) => {
          let files = state.files;

          files[filename] = file;

          return {
            files,
          };
        }),
      removeFile: (filename) =>
        set((state) => {
          let files = state.files;

          delete files[filename];

          return { files };
        }),
      clearFiles: () => set((state) => ({ files: {} })),
    }),
    {
      name: "files-storage",
      storage: createJSONStorage(() => indexedDbStorage("files-storage")),
    }
  )
);
