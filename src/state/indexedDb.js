import { createStore, del, get, set } from "idb-keyval";

export const indexedDbStorage = (name) => {
  const namedStorage = new createStore(name, name);

  return {
    getItem: async (name) => {
      return (await get(name, namedStorage)) || null;
    },
    setItem: async (name, value) => {
      await set(name, value, namedStorage);
    },
    removeItem: async (name) => {
      await del(name, namedStorage);
    },
  };
};
