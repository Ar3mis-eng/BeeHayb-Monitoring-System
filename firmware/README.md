# BeeHayb ESP32 Firmware

This folder contains firmware for ESP32 + DHT22 + MAX9814 that publishes telemetry to the backend via MQTT over WiFi.

## Firmware File

- `BeeHaybESP32/BeeHaybESP32.ino`

## Hardware Wiring

- ESP32 GPIO32 -> DHT22 DATA
- ESP32 3V3 -> DHT22 VCC
- ESP32 GND -> DHT22 GND
- ESP32 GPIO34 -> MAX9814 OUT
- ESP32 3V3 -> MAX9814 VCC
- ESP32 GND -> MAX9814 GND

## Required Libraries

- `PubSubClient`
- `DHT sensor library`
- `ArduinoJson`

## Arduino CLI Setup (Windows)

Run these commands in PowerShell:

```powershell
arduino-cli core update-index
arduino-cli core install esp32:esp32

arduino-cli lib install "PubSubClient"
arduino-cli lib install "DHT sensor library"
arduino-cli lib install "ArduinoJson"
```

## Build and Upload on COM3

```powershell
cd "d:\Projects\Dave\BeeHive Monitoring System\BeeHayb\firmware\BeeHaybESP32"

arduino-cli compile --fqbn esp32:esp32:esp32 BeeHaybESP32.ino
arduino-cli upload -p COM3 --fqbn esp32:esp32:esp32 BeeHaybESP32.ino
```

## Serial Monitor

```powershell
arduino-cli monitor -p COM3 -c baudrate=115200
```

## Important Configuration

Open `BeeHaybESP32.ino` and set:

- `WIFI_SSID`
- `WIFI_PASSWORD`
- `MQTT_HOST` (your backend/MQTT broker LAN IP)
- `ESP32_SERIAL` (must match your device record in DB)
- `HIVE_ID`
