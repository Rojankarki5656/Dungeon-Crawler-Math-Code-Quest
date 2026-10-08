export const ENV = {
  API_BASE_URL: (import.meta.env.VITE_API_URL as string) ?? '',
  SOCKET_URL: (import.meta.env.VITE_SOCKET_URL as string) ?? '',
  SOCKET_PATH: '/socket.io',
  NAMESPACE: '/game',
  TILE_PX: 16,
  DEFAULT_SCALE: 3,
} as const;