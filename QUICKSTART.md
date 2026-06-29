# Bee-Hayb Quick Start Guide

Get up and running with the Bee-Hayb Smart Beehive Monitoring System in 5 minutes!

## Option 1: Using Docker Compose (Recommended)

### Requirements
- Docker and Docker Compose installed
- Android device with USB debugging enabled (for mobile app)

### Steps

1. **Start the Backend and Database**

```bash
cd BeeHayb
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Mosquitto MQTT broker (port 1883)
- Express backend server (port 5000 and 5001)

2. **Verify Services**

```bash
# Check running containers
docker-compose ps

# Verify database
docker-compose exec postgres psql -U postgres -d beehayb -c "SELECT COUNT(*) FROM hives;"

# Check backend logs
docker-compose logs backend
```

3. **Set Up Mobile App**

```bash
cd mobile
npm install

# Update IP address in .env to match your backend server
echo "REACT_APP_API_URL=http://192.168.X.X:5000/api" > .env
echo "REACT_APP_WS_URL=http://192.168.X.X:5001" >> .env
```

4. **Run on Android Device**

Connect your Android device via USB and run:

```bash
npm run android
```

Or start the Metro bundler and run manually:

```bash
# Terminal 1
npm start

# Terminal 2
npx react-native run-android
```

---

## Option 2: Manual Setup

### Requirements
- Node.js 16+
- PostgreSQL 13+
- Mosquitto or other MQTT broker
- Android SDK and USB Debugging enabled

### Steps

1. **Database Setup**

```bash
# Create database
createdb beehayb

# Load schema
psql -U postgres -d beehayb -f database/schema.sql
```

2. **Start MQTT Broker**

```bash
# Using Docker
docker run -d -p 1883:1883 eclipse-mosquitto

# Or install locally
# macOS: brew install mosquitto && brew services start mosquitto
# Linux: sudo apt-get install mosquitto && sudo systemctl start mosquitto
```

3. **Start Backend**

```bash
cd backend
cp .env.example .env

# Edit .env if needed (update DB credentials, MQTT settings)

npm install
npm run dev
```

Backend will be available at:
- API: http://localhost:5000
- WebSocket: http://localhost:5001

4. **Start Mobile App**

```bash
cd mobile
npm install

# Update .env with your backend IP address
# REACT_APP_API_URL=http://192.168.X.X:5000/api
# REACT_APP_WS_URL=http://192.168.X.X:5001

npm run android
```

---

## Default Credentials

- **Username**: `beekeeper`
- **Password**: (Set any password on first login)

---

## Testing the System

### 1. Access Backend API

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "beekeeper",
    "password": "your_password"
  }'

# Get hives
curl -X GET http://localhost:5000/api/hives \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Generate Mock Data

```bash
cd backend
npm run seed
```

This creates 24 hours of sample sensor readings for all hives.

### 3. Simulate ESP32 Data

```bash
# Publish sensor data to MQTT
mosquitto_pub -h localhost -u beehayb_user -P beehayb_pass \
  -t "beehayb/sensor/ESP32-001-ABC123/data" \
  -m '{
    "esp32_serial": "ESP32-001-ABC123",
    "hive_id": 1,
    "temperature": 28.5,
    "humidity": 65.2,
    "sound_level": 55.3,
    "timestamp": '$(date +%s)'000
  }'
```

### 4. View Real-Time Updates

Open the mobile app and navigate to the "Live Monitor" tab to see real-time data updates via WebSocket.

---

## Troubleshooting

### "Cannot connect to backend"

Make sure the IP address in mobile `.env` matches your backend server:

```bash
# Find your IP address
# macOS/Linux: ifconfig | grep "inet "
# Windows: ipconfig | grep "IPv4"

# Use that IP in .env
REACT_APP_API_URL=http://192.168.X.X:5000/api
```

### "Metro bundler error"

```bash
cd mobile
npm install
npm start -- --reset-cache
```

### "PostgreSQL connection refused"

```bash
# Check if PostgreSQL is running
psql -U postgres -h localhost -c "SELECT version();"

# If using Docker:
docker-compose up -d postgres
```

### "MQTT connection error"

```bash
# Test MQTT broker
mosquitto_pub -h localhost -t test -m "hello"

# If using Docker:
docker-compose up -d mosquitto
```

---

## Project Files Location

After setup, you'll have:

```
BeeHayb/
├── backend/            # Express API server
│   └── dist/          # Compiled JavaScript
├── mobile/            # React Native app
│   └── android/       # Android build files
├── database/          # PostgreSQL schema
└── docker-compose.yml # Container orchestration
```

---

## Next Steps

1. **Customize the Dashboard**: Edit components in `mobile/src/components/`
2. **Add More Hives**: Use the Fleet View to manage multiple apiaries
3. **Deploy to Play Store**: Build release APK using `npm run build:android`
4. **Set Up Alerts**: Configure notifications in the backend
5. **Integrate Real ESP32**: Connect actual hardware via MQTT

---

## Production Deployment

See [README.md](./README.md) for detailed production setup instructions.

---

**Need Help?**

Check the README.md for more detailed documentation, or review the inline code comments in the source files.

Happy monitoring! 🐝
