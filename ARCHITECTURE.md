# Bee-Hayb Architecture and Implementation Guide

Complete technical documentation for the Bee-Hayb Smart Beehive Monitoring System.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [Component Details](#component-details)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Deployment](#deployment)
8. [Security](#security)

## System Overview

Bee-Hayb is a comprehensive IoT monitoring system designed for real-time beehive health tracking. The system consists of:

- **Hardware Sensors**: ESP32 with DHT22 (temperature/humidity) and MAX9814 (sound)
- **Backend API**: Express.js server with PostgreSQL database
- **Message Broker**: MQTT for device communication
- **Real-Time Updates**: Socket.IO WebSocket connections
- **Mobile App**: React Native app for iOS/Android

## Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUD/SERVER                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │   PostgreSQL     │  │   MQTT Broker    │                 │
│  │   Database       │  │   (Mosquitto)    │                 │
│  │                  │  │                  │                 │
│  │ - Hives          │  │ - Device comms   │                 │
│  │ - Sensors        │  │ - Pub/Sub        │                 │
│  │ - Users          │  │                  │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
│           │                     │                            │
│  ┌────────▼─────────────────────▼─────────────────────┐    │
│  │      Express.js Backend Server (Port 5000)          │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │                                                      │    │
│  │ - REST API Endpoints                               │    │
│  │ - Authentication (JWT)                             │    │
│  │ - Bee Stress Detection Logic                       │    │
│  │ - MQTT Client Handler                             │    │
│  │ - Socket.IO Server (Port 5001)                    │    │
│  │ - Real-time broadcast                             │    │
│  │                                                      │    │
│  └────────┬─────────────────────────────────────────────┘    │
│           │                                                   │
└─────────────┼───────────────────────────────────────────────┘
              │
         WiFi/Internet
              │
    ┌─────────┴──────────┬──────────────────┐
    │                    │                  │
┌───▼────┐      ┌────────▼─────┐    ┌──────▼──────┐
│  ESP32  │      │ Mobile App   │    │   Dashboard │
│ (Node)  │      │ (React Native)   │   (Web)      │
│         │      │              │    │              │
│ Sensors │      │ iOS/Android  │    │ Future       │
│ MQTT    │      │ Socket.IO    │    │              │
└─────────┘      └──────────────┘    └──────────────┘
```

### Component Architecture

```
┌─ Backend (Express.js)
│  ├─ Models/
│  │  ├─ Hive.ts
│  │  ├─ Device.ts
│  │  ├─ SensorReading.ts
│  │  └─ User.ts
│  │
│  ├─ Controllers/
│  │  ├─ hiveController.ts
│  │  ├─ deviceController.ts
│  │  ├─ sensorController.ts
│  │  └─ authController.ts
│  │
│  ├─ Routes/
│  │  ├─ hives.ts
│  │  ├─ devices.ts
│  │  ├─ sensors.ts
│  │  └─ auth.ts
│  │
│  ├─ Middleware/
│  │  └─ auth.ts (JWT validation)
│  │
│  ├─ MQTT/
│  │  └─ client.ts
│  │
│  ├─ WebSocket/
│  │  └─ socketio.ts
│  │
│  └─ Utils/
│     └─ beeStress.ts
│
└─ Mobile (React Native)
   ├─ Screens/
   │  ├─ LoginScreen.tsx
   │  ├─ LiveMonitorScreen.tsx
   │  ├─ TrendsScreen.tsx
   │  └─ FleetViewScreen.tsx
   │
   ├─ Components/
   │  ├─ Header.tsx
   │  ├─ MetricCard.tsx
   │  ├─ ConnectionBadge.tsx
   │  └─ LiveStatusCard.tsx
   │
   ├─ Charts/
   │  └─ TrendChart.tsx
   │
   ├─ Services/
   │  ├─ api.ts (Axios + REST)
   │  └─ websocket.ts (Socket.IO)
   │
   ├─ Hooks/
   │  └─ useSensorData.ts
   │
   ├─ Utils/
   │  ├─ helpers.ts
   │  └─ store.ts (Zustand)
   │
   └─ Navigation/
      └─ AppNavigator.tsx
```

## Data Flow

### 1. Sensor Data Collection

```
┌─────────────────────────────────────────────────────┐
│ ESP32 Reads Sensors Every 5 Seconds                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│ DHT22:  Reads temperature (°C) and humidity (%)     │
│ MAX9814: Reads sound level (dB) via analog ADC      │
│                                                      │
│ ↓                                                    │
│                                                      │
│ Publishes to MQTT Topic:                           │
│ "beehayb/sensor/{esp32_serial}/data"              │
│                                                      │
│ Payload:                                           │
│ {                                                  │
│   esp32_serial: "ESP32-001-ABC123",               │
│   hive_id: 1,                                     │
│   temperature: 28.5,                              │
│   humidity: 65.2,                                 │
│   sound_level: 55.3,                              │
│   timestamp: 1634567890000                        │
│ }                                                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 2. Backend Processing

```
┌─────────────────────────────────────────────────────┐
│ MQTT Broker Receives Message                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ↓                                                    │
│                                                      │
│ Express MQTT Client Handler:                       │
│ - Parses JSON payload                              │
│ - Validates data                                   │
│ - Calculates bee stress level                      │
│ - Stores in PostgreSQL                             │
│ - Broadcasts via WebSocket                         │
│                                                      │
│ ↓                                                    │
│                                                      │
│ Database INSERT:                                    │
│ INSERT INTO sensor_readings (hive_id, device_id,   │
│   temperature, humidity, sound_level,              │
│   bee_stress_status)                               │
│ VALUES (1, 1, 28.5, 65.2, 55.3, 'Healthy')        │
│                                                      │
│ ↓                                                    │
│                                                      │
│ WebSocket Broadcast:                               │
│ io.to(`hive_1`).emit('sensor_reading', reading)   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 3. Mobile App Updates

```
┌─────────────────────────────────────────────────────┐
│ Mobile App Receives WebSocket Message               │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ↓                                                    │
│                                                      │
│ Update Zustand Store:                              │
│ - Add reading to readings array                    │
│ - Update latestReadings map                        │
│                                                      │
│ ↓                                                    │
│                                                      │
│ React Component Re-render:                         │
│ - MetricCard displays new values                   │
│ - Charts update with new data point                │
│ - Trends recalculate                               │
│ - UI reflects latest state                         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Component Details

### Bee Stress Detection Algorithm

```typescript
Sound Level Range    Status      Color      Action
═════════════════════════════════════════════════════
40 - 60 dB          Healthy      Green      Monitor
61 - 75 dB          Warning      Amber      Alert
76+ dB              Critical     Red        Emergency
```

### Authentication Flow

```
1. User Registration:
   POST /api/auth/register
   → bcryptjs hashes password
   → Store in PostgreSQL

2. User Login:
   POST /api/auth/login
   → Verify credentials
   → Generate JWT token
   → Return token to client

3. Authenticated Requests:
   GET /api/hives
   Header: Authorization: Bearer {token}
   → authMiddleware validates JWT
   → Request proceeds if valid
```

### Real-Time Update Flow

```
1. Mobile App connects to WebSocket:
   socket.io('/') at ws://backend:5001

2. App subscribes to hive:
   socket.emit('subscribe', { hiveId: 1 })
   socket.join('hive_1')

3. Backend receives MQTT message:
   - Processes sensor data
   - Broadcasts to subscribers:
     io.to('hive_1').emit('sensor_reading', data)

4. App receives update:
   - Updates store
   - Re-renders components
```

## API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "beekeeper",
  "email": "beekeeper@example.com",
  "password": "secure_password"
}

Response: 201
{
  "id": 1,
  "username": "beekeeper",
  "email": "beekeeper@example.com"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "beekeeper",
  "password": "secure_password"
}

Response: 200
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "beekeeper",
    "email": "beekeeper@example.com"
  }
}
```

### Hive Endpoints

#### Get All Hives
```
GET /api/hives
Headers: Authorization: Bearer {token}

Response: 200
[
  {
    "id": 1,
    "hive_name": "Hive Alpha",
    "location": "Backyard North",
    "description": "Primary observation hive",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Get Hive by ID
```
GET /api/hives/{id}
Headers: Authorization: Bearer {token}

Response: 200
{
  "id": 1,
  "hive_name": "Hive Alpha",
  ...
}
```

#### Create Hive
```
POST /api/hives
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "hiveName": "Hive Delta",
  "location": "Field East",
  "description": "New production hive"
}

Response: 201
{
  "id": 4,
  "hive_name": "Hive Delta",
  ...
}
```

### Sensor Endpoints

#### Get Latest Reading for Hive
```
GET /api/sensors/hive/{hiveId}/latest
Headers: Authorization: Bearer {token}

Response: 200
{
  "id": 1234,
  "hive_id": 1,
  "temperature": 28.5,
  "humidity": 65.2,
  "sound_level": 55.3,
  "bee_stress_status": "Healthy",
  "recorded_at": "2024-01-15T15:45:30Z"
}
```

#### Get Reading Range
```
GET /api/sensors/hive/{hiveId}/range?
  startTime=2024-01-15T00:00:00Z&
  endTime=2024-01-15T23:59:59Z&
  limit=1000
Headers: Authorization: Bearer {token}

Response: 200
[
  { id: 1, temperature: 28.5, ... },
  { id: 2, temperature: 28.6, ... },
  ...
]
```

## Database Schema

### Tables Overview

```sql
── hives
   ├── id (PK)
   ├── hive_name
   ├── location
   ├── description
   ├── created_at
   └── updated_at

── devices
   ├── id (PK)
   ├── device_name
   ├── esp32_serial (UNIQUE)
   ├── hive_id (FK)
   ├── status
   ├── last_seen
   ├── created_at
   └── updated_at

── sensor_readings
   ├── id (PK)
   ├── hive_id (FK)
   ├── device_id (FK)
   ├── temperature
   ├── humidity
   ├── sound_level
   ├── bee_stress_status
   └── recorded_at

── users
   ├── id (PK)
   ├── username (UNIQUE)
   ├── email (UNIQUE)
   ├── password_hash
   ├── created_at
   └── updated_at

── hive_assignments
   ├── id (PK)
   ├── user_id (FK)
   ├── hive_id (FK)
   ├── role
   └── created_at
```

### Query Examples

```sql
-- Get latest reading for hive
SELECT * FROM sensor_readings 
WHERE hive_id = 1 
ORDER BY recorded_at DESC 
LIMIT 1;

-- Get 24-hour average temperature
SELECT 
  FLOOR(EXTRACT(EPOCH FROM recorded_at) / 3600) * 3600 as hour,
  AVG(temperature) as avg_temp
FROM sensor_readings 
WHERE hive_id = 1 
  AND recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Find critical events
SELECT * FROM sensor_readings 
WHERE bee_stress_status = 'Critical' 
  AND recorded_at > NOW() - INTERVAL '7 days'
ORDER BY recorded_at DESC;
```

## Deployment

### Production Checklist

- [ ] Update environment variables
- [ ] Enable HTTPS/SSL certificates
- [ ] Set strong JWT_SECRET
- [ ] Configure database backups
- [ ] Enable MQTT authentication
- [ ] Set up monitoring/logging
- [ ] Configure firewall rules
- [ ] Test failover scenarios
- [ ] Set up CI/CD pipeline
- [ ] Create admin user account

### Environment Variables

```bash
# database/.env.production
DB_HOST=db.production.example.com
DB_PORT=5432
DB_NAME=beehayb_prod
DB_USER=prod_user
DB_PASSWORD=strong_random_password

# MQTT
MQTT_BROKER=mqtt://mqtt.production.example.com:1883
MQTT_USER=prod_mqtt_user
MQTT_PASS=strong_password

# Server
PORT=5000
NODE_ENV=production
JWT_SECRET=long_random_secure_secret_key_min_32_chars

# SSL/TLS (if using reverse proxy)
ENABLE_HTTPS=true
```

## Security

### Best Practices

1. **Authentication**
   - Use strong JWT secrets (min 32 characters)
   - Implement token refresh mechanism
   - Add rate limiting on auth endpoints

2. **Database**
   - Use parameterized queries (prevent SQL injection)
   - Enable SSL/TLS for DB connections
   - Regular backups and encryption

3. **API**
   - CORS configuration
   - Rate limiting
   - Input validation
   - Request logging

4. **MQTT**
   - Use authentication
   - Encrypt credentials
   - Firewall MQTT port (1883)

5. **Data**
   - Encryption at rest
   - Encryption in transit (TLS/SSL)
   - Regular security audits

### CORS Configuration

```javascript
const corsOptions = {
  origin: ['http://localhost:3000', 'https://app.beehayb.io'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

---

## Support & Resources

- [README.md](./README.md) - Project overview
- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide
- [ANDROID_SETUP.md](./ANDROID_SETUP.md) - Android configuration
- [ESP32_SETUP.md](./ESP32_SETUP.md) - Hardware setup

---

**Built with 🐝 for Bee-Hayb**
