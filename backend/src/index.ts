import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import hiveRoutes from './routes/hives';
import deviceRoutes from './routes/devices';
import sensorRoutes from './routes/sensors';
import authRoutes from './routes/auth';
import { initMqtt, closeMqtt } from './mqtt/client';
import { initSocketIO, broadcastSensorReading, closeSocketIO } from './websocket/socketio';
import { closeDatabase, connectDatabase } from './database/db';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
let isShuttingDown = false;

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

// Middleware
const corsOrigins = parseCorsOrigins();
app.use(
  cors({
    origin: corsOrigins === '*' ? true : corsOrigins,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hives', hiveRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sensors', sensorRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
  });
});

const closeHttpServer = async (): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        const maybeNodeError = error as NodeJS.ErrnoException;
        if (maybeNodeError.code === 'ERR_SERVER_NOT_RUNNING') {
          resolve();
          return;
        }

        reject(error);
        return;
      }

      console.log('HTTP server closed');
      resolve();
    });
  });
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received, shutting down gracefully`);

  try {
    await closeMqtt();
    await closeSocketIO();
    await closeHttpServer();
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    initSocketIO(server);

    await initMqtt((reading) => {
      console.log('Broadcasting sensor reading:', reading);
      broadcastSensorReading(reading.hive_id, reading);
    });

    server.listen(PORT, () => {
      console.log(`BeeHayb backend running on port ${PORT}`);
      console.log('Socket.IO server initialized');
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});

void startServer();

export default app;
