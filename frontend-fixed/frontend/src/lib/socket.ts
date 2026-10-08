import { io, type Socket } from 'socket.io-client';
import { ENV } from '@/config/env';
import { getOrCreatePlayerId, getOrCreatePlayerName } from './storage';

let socket: Socket | null = null;

export interface SocketFactoryOptions {
  onStatus?: (s: 'connecting' | 'online' | 'reconnecting' | 'offline') => void;
}

export function getSocket(opts: SocketFactoryOptions = {}): Socket {
  if (socket?.connected || socket) return socket;

  const baseUrl = ENV.SOCKET_URL.replace(/\/$/, '');
  socket = io(`${baseUrl}${ENV.NAMESPACE}`, {
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
      playerId: getOrCreatePlayerId(),
      playerName: getOrCreatePlayerName(),
    },
  });

  socket.on('connect', () => opts.onStatus?.('online'));
  socket.on('disconnect', () => opts.onStatus?.('reconnecting'));
  socket.io.on('reconnect_attempt', () => opts.onStatus?.('reconnecting'));
  socket.io.on('reconnect', () => opts.onStatus?.('online'));
  socket.on('connect_error', () => opts.onStatus?.('reconnecting'));
  socket.io.on('reconnect_failed', () => opts.onStatus?.('offline'));

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}