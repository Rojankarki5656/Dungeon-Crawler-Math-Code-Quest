import { ENV } from '@/config/env';

const BASE = ENV.API_BASE_URL;

interface AuthUser {
  id: string;
  email: string;
  playerName: string;
  createdAt: number;
  totalScore: number;
  gamesPlayed: number;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const code = (data as any)?.message ?? (data as any)?.error ?? 'UNKNOWN_ERROR';
    // Nest wraps messages in arrays; normalize.
    const message = Array.isArray(code) ? code[0] : code;
    throw new AuthError(String(message).toUpperCase());
  }
  return data as T;
}

export class AuthError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = 'AuthError';
  }
}

export const authApi = {
  signup: (email: string, password: string, playerName: string) =>
    post<AuthResponse>('/api/auth/signup', { email, password, playerName }),

  login: (email: string, password: string) =>
    post<AuthResponse>('/api/auth/login', { email, password }),

  me: async (token: string): Promise<{ user: AuthUser } | null> => {
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  },
};