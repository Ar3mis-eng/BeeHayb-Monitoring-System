import { io, Socket } from 'socket.io-client';
import { SensorReading } from '../types';

const WEBSOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5001';

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
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
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
