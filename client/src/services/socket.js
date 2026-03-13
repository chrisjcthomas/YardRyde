import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
});

// Log connection events for debugging
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error.message);
});

// Connection status helpers
export const getSocket = () => socket;

export const isConnected = () => socket.connected;

export const onConnect = (callback) => {
  socket.on('connect', callback);
};

export const onDisconnect = (callback) => {
  socket.on('disconnect', callback);
};

export const offConnect = (callback) => {
  socket.off('connect', callback);
};

export const offDisconnect = (callback) => {
  socket.off('disconnect', callback);
};

export default socket;
