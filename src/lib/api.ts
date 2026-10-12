import { ENV } from '@/config/env';

const BASE = ENV.API_BASE_URL.replace(/\/$/, '');

function resolveUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${BASE}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(resolveUrl(path), {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, body || res.statusText);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally { clearTimeout(timeout); }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiError'; }
}

export const api = {
  createLobby: (name: string, playerName: string) =>
    request<{ ok: boolean; lobbyId: string; playerId: string }>('/api/lobbies', {
      method: 'POST', body: JSON.stringify({ name, playerName }),
    }),

  joinLobby: (lobbyId: string, playerName: string, playerId: string) =>
    request<{ ok: boolean; lobbyId: string; playerId: string }>(`/api/lobbies/${lobbyId}/join`, {
      method: 'POST', body: JSON.stringify({ playerName, playerId }),
    }),

  getLobby: (lobbyId: string) => request<any>(`/api/lobbies/${lobbyId}`),
  getLeaderboard: (lobbyId: string) => request<any[]>(`/api/lobbies/${lobbyId}/leaderboard`),
  getQuestion: (id: string) => request<any>(`/api/questions/${id}`),
  health: () => request<{ status: string }>('/health'),
};

/** Preloads the question PNG so the modal appears instantly. */
export function preloadQuestionImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = resolveUrl(url);
  });
}