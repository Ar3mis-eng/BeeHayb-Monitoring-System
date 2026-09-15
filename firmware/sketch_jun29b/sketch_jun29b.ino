#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ---------- User Configuration ----------
const char* WIFI_SSID = "GFiber_f8df0";
const char* WIFI_PASSWORD = "wUCPJ5wC";

// HiveMQ Cloud broker for remote deployments.
const char* MQTT_HOST = "f9abe5a644f54cd58bdd982aa7e0ad18.s1.eu.hivemq.cloud";
const uint16_t MQTT_PORT = 8883;
const char* MQTT_USER = "beehayb_device";
const char* MQTT_PASSWORD = "P@ssword2026";

// Must match a device serial in backend DB (devices.esp32_serial).
const char* ESP32_SERIAL = "ESP32-001-ABC123";
const int HIVE_ID = 1;

// Sensor pins (matches your documented wiring)
static const uint8_t DHT_PIN = 32;
static const uint8_t SOUND_PIN = 34;  // ADC1 pin
static const uint8_t DHT_TYPE = DHT22;

// Telemetry timing
static const uint32_t PUBLISH_INTERVAL_MS = 1000;
static const uint8_t SOUND_SAMPLES = 64;
static const uint32_t WIFI_CONNECT_TIMEOUT_MS = 15000;
static const uint32_t WIFI_RETRY_INTERVAL_MS = 10000;
static const uint32_t MQTT_RETRY_INTERVAL_MS = 15000;
static const uint16_t MQTT_PACKET_BUFFER_SIZE = 512;

// ---------- Globals ----------
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClientSecure wifiClient;
PubSubClient mqttClient(wifiClient);

uint32_t lastPublishMs = 0;
uint32_t publishSequence = 0;
uint32_t lastWiFiAttemptMs = 0;
uint32_t lastMqttAttemptMs = 0;

// ---------- Helpers ----------
String sensorTopic() {
  return String("beehayb/sensor/") + ESP32_SERIAL + "/data";
}

String controlTopic() {
  return String("beehayb/device/") + ESP32_SERIAL + "/control";
}

float readSmoothedSoundDb(uint16_t& rawAvgOut, float& voltageOut) {
  uint32_t total = 0;
  for (uint8_t i = 0; i < SOUND_SAMPLES; i++) {
    total += analogRead(SOUND_PIN);
    delay(2);
  }

  // 12-bit ADC: 0-4095
  rawAvgOut = static_cast<uint16_t>(total / SOUND_SAMPLES);
  voltageOut = (static_cast<float>(rawAvgOut) / 4095.0f) * 3.3f;

  // Basic linear mapping for MAX9814 envelope output.
  // Calibrate this in your environment if needed.
  float db = 40.0f + (voltageOut / 3.3f) * 50.0f;
  if (db < 40.0f) db = 40.0f;
  if (db > 90.0f) db = 90.0f;
  return db;
}

bool connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t startMs = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startMs) < WIFI_CONNECT_TIMEOUT_MS) {
    delay(500);
    Serial.print('.');
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("[WiFi] Connected");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println();
  Serial.println("[WiFi] Connection failed");
  return false;
}

bool ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  uint32_t now = millis();
  if (now - lastWiFiAttemptMs < WIFI_RETRY_INTERVAL_MS) {
    return false;
  }

  lastWiFiAttemptMs = now;
  return connectWiFi();
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("[MQTT] Message on ");
  Serial.print(topic);
  Serial.print(": ");

  for (unsigned int i = 0; i < length; i++) {
    Serial.print(static_cast<char>(payload[i]));
  }
  Serial.println();
}

bool connectMqtt() {
  if (!ensureWiFi()) {
    Serial.println("[MQTT] Skipping connect because Wi-Fi is not ready");
    return false;
  }

  if (mqttClient.connected()) {
    return true;
  }

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  Serial.print("[MQTT] Connecting to ");
  Serial.print(MQTT_HOST);
  Serial.print(':');
  Serial.println(MQTT_PORT);

  if (mqttClient.connect(ESP32_SERIAL, MQTT_USER, MQTT_PASSWORD)) {
    Serial.println("[MQTT] Connected");
    mqttClient.subscribe(controlTopic().c_str());
    return true;
  }

  Serial.print("[MQTT] Failed rc=");
  Serial.print(mqttClient.state());
  Serial.println(" retry later");
  return false;
}

bool ensureMqtt() {
  if (mqttClient.connected()) {
    return true;
  }

  uint32_t now = millis();
  if (now - lastMqttAttemptMs < MQTT_RETRY_INTERVAL_MS) {
    return false;
  }

  lastMqttAttemptMs = now;
  return connectMqtt();
}

void publishTelemetry() {
  if (!ensureWiFi() || !ensureMqtt()) {
    Serial.println("[PUB] Skipping telemetry until Wi-Fi and MQTT are connected");
    return;
  }

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("[DHT22] Read failed, skipping publish");
    return;
  }

  uint16_t soundRawAvg = 0;
  float soundVoltage = 0.0f;
  float soundDb = readSmoothedSoundDb(soundRawAvg, soundVoltage);

  Serial.print("Temperature: ");
  Serial.println(temperature);

  Serial.print("Humidity: ");
  Serial.println(humidity);

  Serial.print("Sound: ");
  Serial.println(soundDb);

  StaticJsonDocument<256> doc;
  doc["esp32_serial"] = ESP32_SERIAL;
  doc["hive_id"] = HIVE_ID;
  doc["publish_seq"] = ++publishSequence;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["sound_level"] = soundDb;
  doc["sound_adc_raw"] = soundRawAvg;
  doc["sound_voltage"] = soundVoltage;
  doc["uptime_ms"] = millis();
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["timestamp"] = millis();

  char payload[256];
  size_t len = serializeJson(doc, payload, sizeof(payload));
  const String topic = sensorTopic();

  if (len >= sizeof(payload)) {
    Serial.println("[PUB] Warning: payload may be truncated by buffer size");
  }

  // PubSubClient limits total packet size (topic + header + payload).
  const size_t estimatedPacketSize = topic.length() + len + 10;

  bool ok = mqttClient.publish(topic.c_str(), payload, len);
  if (ok) {
    Serial.print("[PUB] ");
    Serial.println(payload);
  } else {
    Serial.println("[PUB] Failed to publish telemetry");
    Serial.print("[PUB] mqttConnected=");
    Serial.println(mqttClient.connected() ? "true" : "false");
    Serial.print("[PUB] mqttState=");
    Serial.println(mqttClient.state());
    Serial.print("[PUB] payloadBytes=");
    Serial.println(len);
    Serial.print("[PUB] topicBytes=");
    Serial.println(topic.length());
    Serial.print("[PUB] estimatedPacketBytes=");
    Serial.println(estimatedPacketSize);
    Serial.print("[PUB] mqttBufferBytes=");
    Serial.println(MQTT_PACKET_BUFFER_SIZE);
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  dht.begin();
  pinMode(SOUND_PIN, INPUT);

  // Ensure full ADC range for stable analog reads.
  analogReadResolution(12);
  analogSetPinAttenuation(SOUND_PIN, ADC_11db);

  wifiClient.setInsecure();
  if (!mqttClient.setBufferSize(MQTT_PACKET_BUFFER_SIZE)) {
    Serial.println("[MQTT] Failed to set packet buffer size");
  }

  connectWiFi();
  connectMqtt();
}

void loop() {
  ensureWiFi();
  ensureMqtt();

  mqttClient.loop();

  uint32_t now = millis();
  if (now - lastPublishMs >= PUBLISH_INTERVAL_MS) {
    lastPublishMs = now;
    publishTelemetry();
  }
}
