# ESP32 Integration Guide

Instructions for connecting and configuring the ESP32 DevKit V1 with DHT22 and MAX9814 sensors.

## Hardware Setup

### Components Required

- ESP32 DevKit V1
- DHT22 Temperature/Humidity Sensor
- MAX9814 Sound Sensor Module
- Breadboard and jumper wires
- USB cable for programming

### Wiring Diagram

```
ESP32 PIN          SENSOR PIN      CONNECTION
==============================================

GPIO 32            DHT22 DATA      Signal wire
3V3                DHT22 VCC       Power (3.3V)
GND                DHT22 GND       Ground

GPIO 34 (ADC1)     MAX9814 OUT     Signal wire (analog)
3V3                MAX9814 VCC     Power (3.3V)
GND                MAX9814 GND     Ground
```

## Software Setup

### Arduino IDE Configuration

1. **Install Arduino IDE** from https://www.arduino.cc/en/software
2. **Add ESP32 Board**: 
   - File > Preferences > Additional Board URLs
   - Add: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools > Board Manager > Search "ESP32" > Install

3. **Select Board**: Tools > Board > ESP32 DevKit V1

### Required Libraries

Install via Arduino IDE:
- PubSubClient (MQTT)
- DHT Sensor Library
- Adafruit Unified Sensor

Library > Manage Libraries > Search and install each

## Arduino Sketch

### Configuration

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// MQTT Configuration
const char* mqtt_broker = "192.168.X.X";  // Bee-Hayb backend IP
const int mqtt_port = 1883;
const char* mqtt_username = "beehayb_user";
const char* mqtt_password = "beehayb_pass";
const char* esp32_serial = "ESP32-001-ABC123";  // Unique device ID

// Sensor Configuration
#define DHT_PIN 32
#define DHT_TYPE DHT22
#define SOUND_PIN 34  // Analog pin for sound sensor

// Hive Configuration
const int hive_id = 1;  // Match backend hive ID

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Initialize sensors
  dht.begin();
  pinMode(SOUND_PIN, INPUT);
  
  // Connect to WiFi
  connectWiFi();
  
  // Setup MQTT
  client.setServer(mqtt_broker, mqtt_port);
  connectMQTT();
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();
  
  // Read sensors every 5 seconds
  delay(5000);
  readAndPublishSensors();
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi");
  }
}

void connectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (client.connect(esp32_serial, mqtt_username, mqtt_password)) {
      Serial.println("connected");
      
      // Subscribe to control topics if needed
      String controlTopic = String("beehayb/device/") + esp32_serial + "/control";
      client.subscribe(controlTopic.c_str());
      
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void readAndPublishSensors() {
  // Read DHT22
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Read MAX9814 sound sensor
  int raw_sound = analogRead(SOUND_PIN);
  float sound_level = mapSoundLevel(raw_sound);
  
  // Check for valid readings
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  
  // Create JSON payload
  DynamicJsonDocument doc(200);
  doc["esp32_serial"] = esp32_serial;
  doc["hive_id"] = hive_id;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["sound_level"] = sound_level;
  doc["timestamp"] = millis();
  
  // Serialize and publish
  String topic = String("beehayb/sensor/") + esp32_serial + "/data";
  String payload;
  serializeJson(doc, payload);
  
  if (client.publish(topic.c_str(), payload.c_str())) {
    Serial.print("Published: ");
    Serial.println(payload);
  } else {
    Serial.println("Failed to publish sensor data");
  }
}

// Convert analog reading to sound level in dB
float mapSoundLevel(int raw) {
  // Calibration: adjust these values based on your sensor
  // Raw range: 0-4095 (12-bit ADC)
  // Sound range: 40-90 dB
  
  float voltage = (raw / 4095.0) * 3.3;
  float soundLevel = 40 + (voltage / 3.3) * 50;  // Scale to 40-90 dB range
  
  return constrain(soundLevel, 40, 90);
}

// MQTT message callback (for control commands)
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);
  Serial.print("Payload: ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}
```

## Setup Steps

1. **Update Configuration**: 
   - Change `ssid`, `password`, `mqtt_broker` IP
   - Set unique `esp32_serial` for each device
   - Set `hive_id` to match your backend hive

2. **Upload Sketch**:
   - Plug ESP32 into USB
   - Sketch > Upload (or Ctrl+U)
   - Open Serial Monitor (Ctrl+Shift+M) to verify

3. **Verify Connection**:
   - Should see WiFi connection message
   - Should see MQTT connection message
   - Should see sensor readings being published

## Testing

### View MQTT Messages

```bash
# Subscribe to all sensor topics
mosquitto_sub -h 192.168.X.X -u beehayb_user -P beehayb_pass \
  -t "beehayb/sensor/+/data"

# Or specific device
mosquitto_sub -h 192.168.X.X -u beehayb_user -P beehayb_pass \
  -t "beehayb/sensor/ESP32-001-ABC123/data"
```

### Check Backend Logs

```bash
# If using Docker
docker-compose logs backend -f

# If running locally
cd backend && npm run dev
```

### View in Mobile App

1. Open Bee-Hayb app
2. Navigate to "Live Monitor"
3. Should see real-time sensor data

## Troubleshooting

### WiFi Connection Failed
- Check SSID and password spelling
- Verify device is in WiFi range
- Check WiFi frequency (ESP32 supports 2.4GHz only)

### MQTT Connection Failed
- Verify MQTT broker is running
- Check `mqtt_broker` IP address
- Verify credentials: `mqtt_username`, `mqtt_password`
- Ensure firewall allows port 1883

### Sensor Not Reading
- Check DHT22 wiring to GPIO 4
- Verify 10kΩ pull-up resistor on DHT signal line
- Check power supply voltage (should be 3.3V)

### Sound Sensor Issues
- Verify MAX9814 is connected to GPIO 35 (analog)
- Calibrate `mapSoundLevel()` function based on your environment
- Check microphone sensitivity settings on MAX9814

## Serial Communication

Monitor ESP32 output via Serial:

```bash
# macOS/Linux
screen /dev/ttyUSB0 115200

# Windows (using PuTTY)
# or use Arduino IDE Serial Monitor
```

## Power Considerations

For production:
- Use external 5V power supply (USB or regulated PSU)
- Add capacitors near power pins (100µF electrolytic + 0.1µF ceramic)
- Consider low-power mode for battery operation

## Multiple Devices

For multiple hives:
1. Create separate ESP32 devices
2. Give each unique `esp32_serial`
3. Update `hive_id` in sketch
4. Register devices in backend

---

## API Integration

Sensor data is automatically:
1. Published to MQTT topic
2. Received by backend
3. Stored in PostgreSQL
4. Broadcast to mobile app via WebSocket

## Future Enhancements

- Sleep mode for power efficiency
- OTA (Over-The-Air) updates
- Local data caching
- BLE support
- Additional sensors (weight, video)

---

**Happy Beekeeping! 🐝**
