import { create } from "zustand";
import type { User } from "../types";
import { api } from "../services/api";

type AuthState = {
  user: User | null;
  token: string | null;
  isHydrating: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name?: string }) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("streampilot_token"),
  isHydrating: true,
  login: async (email, password) => {
    const result = await api.auth.login({ email, password });
    localStorage.setItem("streampilot_token", result.token);
    set({ user: result.user, token: result.token });
  },
  register: async (input) => {
    const result = await api.auth.register(input);
    localStorage.setItem("streampilot_token", result.token);
    set({ user: result.user, token: result.token });
  },
  hydrate: async () => {
    const token = get().token;
    if (!token) {
      set({ isHydrating: false });
      return;
    }

    try {
      const user = await api.auth.me();
      set({ user, isHydrating: false });
    } catch {
      localStorage.removeItem("streampilot_token");
      set({ user: null, token: null, isHydrating: false });
    }
  },
  logout: () => {
    localStorage.removeItem("streampilot_token");
    set({ user: null, token: null });
  }
}));
