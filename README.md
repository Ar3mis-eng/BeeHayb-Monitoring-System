# Bee-Hayb Smart Beehive Monitoring System

A production-ready mobile application for monitoring beehive health in real time.

## Technology Stack

### Mobile App
- React Native (CLI, NOT Expo)
- TypeScript
- React Navigation
- Victory Native for charts
- Socket.IO for real-time updates

### Backend
- Node.js / Express.js
- REST API
- JWT Authentication
- PostgreSQL

### Hardware
- ESP32 DevKit V1
- DHT22 Temperature and Humidity Sensor
- MAX9814 Sound Sensor Module

### Communication
- MQTT Protocol
- WebSocket (Socket.IO)
- WiFi Transmission

## Project Structure

```
BeeHayb/
├── mobile/                 # React Native CLI app
│   ├── src/
│   │   ├── screens/       # Screen components
│   │   ├── components/    # Reusable components
│   │   ├── navigation/    # Navigation setup
│   │   ├── services/      # API and WebSocket services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── charts/        # Chart components
│   │   ├── utils/         # Utilities and state management
│   │   └── types/         # TypeScript types
│   ├── package.json
│   ├── App.tsx
│   └── index.js
│
├── backend/                # Express.js server
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Auth and other middleware
│   │   ├── mqtt/          # MQTT client integration
│   │   ├── websocket/     # Socket.IO setup
│   │   ├── database/      # DB connection and seed script
│   │   ├── utils/         # Utility functions
│   │   └── index.ts       # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── database/              # PostgreSQL schema
    └── schema.sql
```

## Setup Instructions

### 1. Database Setup

Install PostgreSQL and create the database:

```bash
createdb beehayb
psql -U postgres -d beehayb -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

The backend will start on `http://localhost:5000`

### 3. Mobile App Setup

#### Prerequisites
- Node.js 16+
- Android SDK and Android Studio
- USB Debugging enabled on Android device

#### Installation

```bash
cd mobile
npm install

# For Android with USB debugging:
npm run android

# Or start the Metro bundler and run manually:
npm start
# In another terminal:
npx react-native run-android
```

## Configuration

### Backend Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=beehayb
DB_USER=postgres
DB_PASSWORD=postgres

# MQTT
MQTT_BROKER=mqtt://mosquitto:1883
MQTT_USER=beehayb_user
MQTT_PASS=beehayb_pass

# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key

# WebSocket
WS_PORT=5001
```

### Mobile App Environment Variables

```bash
# Backend API (adjust IP to your backend server)
REACT_APP_API_URL=http://192.168.1.100:5000/api
REACT_APP_WS_URL=http://192.168.1.100:5001
REACT_APP_DEBUG=false
```

## Features

### Dashboard
- **Live Monitor**: Real-time sensor data display
  - Temperature, Humidity, Sound Level, Hive Weight
  - Trend indicators
  - Connection status badge
  - Live status card with sensor source

- **Trends**: 24-hour trend charts
  - Temperature trends
  - Humidity trends
  - Sound level trends

- **Fleet View**: Multiple hive management
  - View all hives at once
  - Select hive to monitor
  - Quick metrics overview

### Authentication
- User registration and login
- JWT token-based authentication
- Session persistence

### Real-Time Updates
- WebSocket connections for live sensor data
- MQTT integration for ESP32 devices
- Automatic reconnection and fallback

### Bee Stress Detection
- Healthy: Sound Level 40-60 dB
- Warning: Sound Level 61-75 dB
- Critical: Sound Level 76+ dB

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Hives
- `GET /api/hives` - Get all hives
- `GET /api/hives/:id` - Get specific hive
- `POST /api/hives` - Create new hive
- `PUT /api/hives/:id` - Update hive
- `DELETE /api/hives/:id` - Delete hive

### Devices
- `GET /api/devices` - Get all devices
- `GET /api/devices/:id` - Get specific device
- `GET /api/devices/hive/:hiveId` - Get devices for hive
- `POST /api/devices` - Create new device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Sensors
- `GET /api/sensors` - Get all readings
- `GET /api/sensors/hive/:hiveId` - Get readings for hive
- `GET /api/sensors/hive/:hiveId/latest` - Get latest reading
- `GET /api/sensors/hive/:hiveId/range` - Get readings in time range
- `POST /api/sensors` - Create new reading

## Building for Production

### Android Release Build

```bash
cd mobile/android
./gradlew assembleRelease
# APK location: mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Backend Production

```bash
cd backend
npm run build
NODE_ENV=production npm start
```

## MQTT Integration

ESP32 devices should publish data to the MQTT broker at:

Topic: `beehive/sensor/{esp32_serial}/data`

Payload format:
```json
{
  "esp32_serial": "ESP32-001-ABC123",
  "hive_id": 1,
  "temperature": 28.5,
  "humidity": 65.2,
  "sound_level": 55.3,
  "timestamp": 1634567890000
}
```

## Demo Credentials

- Username: `beekeeper`
- Password: (Create your own during first login)

## Development

### Mock Data

Generate mock sensor data for testing:

```bash
cd backend
npm run seed
```

### Running Tests

```bash
# Backend
cd backend
npm test

# Mobile
cd mobile
npm test
```

## Troubleshooting

### Android USB Debugging

1. Enable Developer Options: Tap "Build Number" 7 times in Settings > About
2. Enable USB Debugging: Settings > Developer Options > USB Debugging
3. Connect device and verify: `adb devices`

### Metro Bundler Issues

```bash
# Clear cache and restart
cd mobile
npm start -- --reset-cache
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U postgres -h localhost -d beehayb -c "SELECT 1"
```

### MQTT Connection

Ensure Mosquitto (or your MQTT broker) is running:

```bash
# Docker example
docker run -d --name mosquitto -p 1883:1883 eclipse-mosquitto
```

## Future Enhancements

- Bluetooth support for direct device communication
- Push notifications for alerts
- Advanced analytics and reporting
- Multi-user hive management
- Integration with smart home systems
- Video monitoring support
- Weather data integration

## License

MIT

## Support

For issues and questions, please create an issue in the repository.

---

**Bee-Hayb** - Smart Monitoring for Healthier Hives 🐝
