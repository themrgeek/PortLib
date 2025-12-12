import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setAuth: (payload: { user?: AuthUser | null; token?: string | null }) => void;
  logout: () => void;
};

const secureStoreStorage: StateStorage = {
  getItem: async (name) => {
    const value = await SecureStore.getItemAsync(name);
    return value ?? null;
  },
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
};

const createWebStorage = (): StateStorage => ({
  getItem: (name) => {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(name);
  },
});

const storage: StateStorage = (() => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return createWebStorage();
    }
  } catch {
    // Fall through to secure storage
  }
  return secureStoreStorage;
})();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      setAuth: ({ user = null, token = null }) =>
        set({
          user,
          token,
          isAuthenticated: Boolean(token),
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-state",
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
