import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { authApi } from '@/lib/auth';

interface AuthUser {
  id: string;
  email: string;
  playerName: string;
  totalScore: number;
  gamesPlayed: number;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  signup: (email: string, password: string, playerName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = 'auth:token';
const USER_KEY = 'auth:user';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,

  /** Called once on app boot — restores from localStorage + re-validates. */
  hydrate: async () => {
    const token = storage.get<string | null>(TOKEN_KEY, null);
    const cachedUser = storage.get<AuthUser | null>(USER_KEY, null);

    if (!token || !cachedUser) {
      set({ hydrated: true });
      return;
    }

    // Optimistic: show cached user immediately.
    set({ token, user: cachedUser });

    // Verify asynchronously — if token expired, log out.
    const fresh = await authApi.me(token).catch(() => null);
    if (!fresh) {
      storage.remove(TOKEN_KEY);
      storage.remove(USER_KEY);
      set({ token: null, user: null, hydrated: true });
      return;
    }
    set({ user: fresh.user, hydrated: true });
    storage.set(USER_KEY, fresh.user);
  },

  signup: async (email, password, playerName) => {
    const { token, user } = await authApi.signup(email, password, playerName);
    storage.set(TOKEN_KEY, token);
    storage.set(USER_KEY, user);
    set({ token, user });
  },

  login: async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    storage.set(TOKEN_KEY, token);
    storage.set(USER_KEY, user);
    set({ token, user });
  },

  logout: () => {
    storage.remove(TOKEN_KEY);
    storage.remove(USER_KEY);
    set({ token: null, user: null });
  },
}));