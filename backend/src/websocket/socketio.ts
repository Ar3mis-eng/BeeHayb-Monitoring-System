import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SensorReading } from '../models/SensorReading';

let io: Server | null = null;

const parseCorsOrigins = (): string[] | '*' => {
  const corsOrigin = process.env.CORS_ORIGIN || '*';

  if (corsOrigin.trim() === '*') {
    return '*';
  }

  return corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

export const initSocketIO = (httpServer: HTTPServer) => {
  const origins = parseCorsOrigins();

  io = new Server(httpServer, {
    cors: {
      origin: origins === '*' ? true : origins,
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

export const closeSocketIO = async (): Promise<void> => {
  if (!io) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    io!.close((err?: Error) => {
      if (err) {
        const maybeNodeError = err as NodeJS.ErrnoException;
        if (maybeNodeError.code === 'ERR_SERVER_NOT_RUNNING') {
          resolve();
          return;
        }

        reject(err);
        return;
      }

      resolve();
    });
  });

  io = null;
  console.log('Socket.IO server closed');
};
