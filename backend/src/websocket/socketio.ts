import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SensorReading } from '../models/SensorReading';

let io: Server | null = null;

export const initSocketIO = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('subscribe', (data) => {
      const { hiveId } = data;
      const room = `hive_${hiveId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
      socket.emit('subscribed', { room });
    });

    socket.on('unsubscribe', (data) => {
      const { hiveId } = data;
      const room = `hive_${hiveId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const broadcastSensorReading = (hiveId: number, reading: SensorReading) => {
  if (io) {
    io.to(`hive_${hiveId}`).emit('sensor_reading', reading);
  }
};

export const broadcastDeviceStatus = (deviceId: number, status: string) => {
  if (io) {
    io.emit('device_status', { deviceId, status });
  }
};

export const getIO = () => io;
