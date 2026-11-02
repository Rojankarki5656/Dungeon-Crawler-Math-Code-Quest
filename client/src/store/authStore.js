import { create } from "zustand";
import { api, apiGet, apiPost, apiError } from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  error: null,

  async init() {
    try {
      const { user } = await apiGet("/auth/me");
      set({ user });
      connectSocket();
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  async login(email, password) {
    set({ error: null, loading: true });
    try {
      const { user } = await apiPost("/auth/login", { email, password });
      set({ user, loading: false });
      connectSocket();
      return true;
    } catch (e) {
      set({ error: apiError(e), loading: false });
      return false;
    }
  },

  async register(username, email, password) {
    set({ error: null, loading: true });
    try {
      const { user } = await apiPost("/auth/register", { username, email, password });
      set({ user, loading: false });
      connectSocket();
      return true;
    } catch (e) {
      set({ error: apiError(e), loading: false });
      return false;
    }
  },

  async logout() {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    disconnectSocket();
    set({ user: null });
  },

  updateUser(patch) {
    set((s) => (s.user ? { user: { ...s.user, ...patch } } : {}));
  },

  async refreshMe() {
    try {
      const { user } = await apiGet("/auth/me");
      set({ user });
    } catch { /* ignore */ }
  },
}));