import { create } from "zustand";

import { api } from "../lib/api";
import { tokenStore } from "../lib/tokenStore";
import type { ApiResponse, TokenPair, User } from "../lib/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => void;
  can: (permission: string) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: false,

  async login(email, password) {
    const res = await api.post<ApiResponse<TokenPair>>("/auth/login", {
      email,
      password,
    });
    const pair = res.data.data!;
    tokenStore.set(pair.access_token, pair.refresh_token);
    await get().loadMe();
  },

  async loadMe() {
    set({ loading: true });
    try {
      const res = await api.get<ApiResponse<User>>("/auth/me");
      set({ user: res.data.data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout() {
    tokenStore.clear();
    set({ user: null });
  },

  can(permission) {
    return get().user?.permissions.includes(permission) ?? false;
  },
}));
