import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';

const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason: string) => {
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (error: Error) => {
  console.error('Socket connection error:', error.message);
});

export default socket;
