import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (window.location.origin + '/ws');

const client = new Client({
  webSocketFactory: () => new SockJS(SOCKET_URL),
  debug: (msg) => {
    // console.log('STOMP Debug:', msg);
  },
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
});

const eventCallbacks = new Map();

client.onConnect = (frame) => {
  console.log('STOMP connected:', frame);
  socket.connected = true;
  
  // Default subscriptions
  subscribe('vehicles', (data) => {
    triggerCallbacks('vehicles:state', data);
  });
  
  subscribe('reports', (data) => {
    triggerCallbacks('reports:state', data);
  });

  triggerCallbacks('connect', frame);
};

client.onStompError = (frame) => {
  console.error('STOMP error:', frame.headers['message']);
  socket.connected = false;
  triggerCallbacks('connect_error', frame);
};

client.onDisconnect = () => {
  console.log('STOMP disconnected');
  socket.connected = false;
  triggerCallbacks('disconnect', 'disconnected');
};

const subscribe = (topic, callback) => {
  return client.subscribe(`/topic/${topic}`, (message) => {
    if (message.body) {
      callback(JSON.parse(message.body));
    }
  });
};

const triggerCallbacks = (event, data) => {
  const callbacks = eventCallbacks.get(event) || [];
  callbacks.forEach(cb => cb(data));
};

export const socket = {
  on: (event, callback) => {
    const callbacks = eventCallbacks.get(event) || [];
    callbacks.push(callback);
    eventCallbacks.set(event, callbacks);
  },
  off: (event, callback) => {
    const callbacks = eventCallbacks.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  },
  emit: (event, data) => {
    const destination = event.startsWith('/') ? event : `/app/${event}`;
    client.publish({
      destination,
      body: data ? JSON.stringify(data) : '',
    });
  },
  connected: false
};

// Start the client
client.activate();

// Connection status helpers
export const getSocket = () => socket;
export const isConnected = () => client.connected;
export const onConnect = (callback) => socket.on('connect', callback);
export const onDisconnect = (callback) => socket.on('disconnect', callback);
export const offConnect = (callback) => socket.off('connect', callback);
export const offDisconnect = (callback) => socket.off('disconnect', callback);

export default socket;
