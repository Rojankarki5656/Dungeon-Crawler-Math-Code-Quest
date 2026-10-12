import { io, type Socket } from 'socket.io-client';
import { ENV } from '@/config/env';
import { useAuthStore } from '@/state/authStore';

let socket: Socket | null = null;

export interface SocketFactoryOptions {
  onStatus?: (s: 'connecting' | 'online' | 'reconnecting' | 'offline') => void;
}

export function getSocket(opts: SocketFactoryOptions = {}): Socket {
  if (socket) return socket;

  const { token, user } = useAuthStore.getState();

  socket = io(`${ENV.SOCKET_URL}${ENV.NAMESPACE}`, {
    path: ENV.SOCKET_PATH,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5_000,
    randomizationFactor: 0.4,
    timeout: 10_000,
    autoConnect: true,
    auth: {
      token: token ?? '',
      playerName: user?.playerName ?? '',
    },
  });

  socket.on('connect', () => opts.onStatus?.('online'));
  socket.on('disconnect', () => opts.onStatus?.('offline'));
  socket.io.on('reconnect_attempt', () => opts.onStatus?.('reconnecting'));
  socket.io.on('reconnect', () => opts.onStatus?.('online'));
  socket.on('connect_error', () => opts.onStatus?.('offline'));
  socket.on('auth:required', () => {
    // Server rejected our token — log out and let the auth screen take over.
    useAuthStore.getState().logout();
    disconnectSocket();
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}