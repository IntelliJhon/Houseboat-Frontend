import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api.*$/, '') || 'https://houseboat-backend.onrender.com';

let socket: Socket | null = null;

export const getSupportSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });
  }
  return socket;
};
