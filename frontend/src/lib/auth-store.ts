import { create } from "zustand";
import type { User } from "../types";

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
};

const tokenFromStorage = localStorage.getItem("sahayyam-token");

export const useAuthStore = create<AuthState>((set) => ({
  token: tokenFromStorage,
  user: null,
  setSession: (token, user) => {
    localStorage.setItem("sahayyam-token", token);
    set({ token, user });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem("sahayyam-token");
    set({ token: null, user: null });
  },
}));
