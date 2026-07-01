import { io, Socket } from 'socket.io-client';
import Config from 'react-native-config';
import { SensorReading } from '../types';

const WEBSOCKET_URL = (Config.SOCKET_BASE_URL || '').trim().replace(/\/$/, '');

if (!WEBSOCKET_URL) {
  throw new Error('SOCKET_BASE_URL is not configured');
}

let socket: Socket | null = null;

export const initializeWebSocket = (): Socket => {
  if (!socket) {
    socket = io(WEBSOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log(`Socket connected: ${WEBSOCKET_URL}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`Socket reconnect attempt: ${attempt}`);
    });

    socket.io.on('reconnect', (attempt) => {
      console.log(`Socket reconnected after attempts: ${attempt}`);
    });

    socket.io.on('reconnect_error', (error) => {
      console.error('Socket reconnect error:', error);
    });

    socket.io.on('reconnect_failed', () => {
      console.error('Socket reconnect failed');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connect error:', error.message);
    });
  }

  return socket;
};

export const subscribeToHive = (hiveId: number, onMessage: (reading: SensorReading) => void) => {
  if (!socket) {
    initializeWebSocket();
  }

  socket!.emit('subscribe', { hiveId });

  socket!.on('sensor_reading', onMessage);
  socket!.on('subscribed', (data) => {
    console.log('Subscribed to room:', data.room);
  });
};

export const unsubscribeFromHive = (hiveId: number) => {
  if (socket) {
    socket.emit('unsubscribe', { hiveId });
    socket.off('sensor_reading');
  }
};

export const getSocket = (): Socket | null => socket;

export const closeWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};
