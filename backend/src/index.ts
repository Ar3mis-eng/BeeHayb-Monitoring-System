import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import hiveRoutes from './routes/hives';
import deviceRoutes from './routes/devices';
import sensorRoutes from './routes/sensors';
import authRoutes from './routes/auth';
import { initMqtt } from './mqtt/client';
import { initSocketIO, broadcastSensorReading } from './websocket/socketio';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.IO
initSocketIO(server);

// Initialize MQTT with callback for real-time updates
initMqtt((payload) => {
  console.log('Broadcasting sensor reading:', payload);
  broadcastSensorReading(payload.hive_id, {
    id: 0,
    hive_id: payload.hive_id,
    temperature: payload.temperature,
    humidity: payload.humidity,
    sound_level: payload.sound_level,
    bee_stress_status: 'Healthy',
    recorded_at: new Date(),
  });
});

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

// Start server
server.listen(PORT, () => {
  console.log(`BeeHayb backend running on port ${PORT}`);
  console.log(`WebSocket server running on ${server.address()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
