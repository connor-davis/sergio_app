import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { indexedDbStorage } from "./indexedDb";
import Dexie from "dexie";

const db = new Dexie("filedatabase");
db.version(1).stores({
  files: "++id, name, content",
});

const saveFileToIndexedDB = async (file) => {
  const reader = new FileReader();

  reader.onload = async (event) => {
    const fileContent = event.target.result;

    // Save the file to the IndexedDB database
    await db.files.add({
      name: file.name,
      content: fileContent,
    });
  };

  reader.readAsArrayBuffer(file);
};

export const readFileFromIndexedDB = async (fileName) => {
  const file = await db.files.where("name").equals(fileName).first();

  if (!file) {
    throw new Error(`File with name "${fileName}" not found in IndexedDB.`);
  }

  return file.content;
};

export const removeFileFromIndexedDB = async (filename) => {
  await db.files.delete(filename);
};

export const clearFilesFromIndexedDB = async () => {
  await db.files.clear();
};

export const useHistoricalFiles = create(
  persist(
    (set, get) => ({
      files: [],
      addFile: (filename, file) =>
        set((state) => {
          saveFileToIndexedDB(file)
            .then(() => {
              console.log("File saved to IndexedDB.");
            })
            .catch((error) => {
              console.error("Error saving file to IndexedDB:", error);
            });

          return {
            files: [
              ...state.files.filter((name) => name !== filename),
              file.name,
            ],
          };
        }),
      removeFile: (filename) =>
        set((state) => {
          removeFileFromIndexedDB(filename);

          return [...state.files.filter((name) => name !== filename)];
        }),
      clearFiles: () => set((state) => ({ files: [] })),
    }),
    {
      name: "files-storage",
      storage: createJSONStorage(() => indexedDbStorage("files-storage")),
    }
  )
);
