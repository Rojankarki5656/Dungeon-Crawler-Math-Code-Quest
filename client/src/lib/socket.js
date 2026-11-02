import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
  path: "/socket.io",
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket", "polling"],
});

export function connectSocket() {
  if (!socket.connected) socket.connect();
}
export function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}