import mqtt, { MqttClient } from 'mqtt';
import { SensorReadingModel } from '../models/SensorReading';
import { DeviceModel } from '../models/Device';
import { calculateBeeStress } from '../utils/beeStress';
import { SensorReading } from '../models/SensorReading';

let mqttClient: MqttClient | null = null;

export interface MqttPayload {
  esp32_serial: string;
  hive_id: number;
  publish_seq?: number;
  temperature: number;
  humidity: number;
  sound_level: number;
  timestamp: number;
}

const getBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
};

export const initMqtt = async (onMessageCallback?: (reading: SensorReading) => void) => {
  const brokerUrl = process.env.MQTT_BROKER || process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
  const username = process.env.MQTT_USER;
  const password = process.env.MQTT_PASS;
  const reconnectPeriod = parseInt(process.env.MQTT_RECONNECT_PERIOD_MS || '5000', 10);
  const connectTimeout = parseInt(process.env.MQTT_CONNECT_TIMEOUT_MS || '30000', 10);
  const keepalive = parseInt(process.env.MQTT_KEEPALIVE_SECONDS || '60', 10);
  const clean = getBoolean(process.env.MQTT_CLEAN, true);
  const rejectUnauthorized = getBoolean(process.env.MQTT_REJECT_UNAUTHORIZED, true);

  mqttClient = mqtt.connect(brokerUrl, {
    username,
    password,
    clientId: process.env.MQTT_CLIENT_ID || 'beehayb-backend',
    reconnectPeriod,
    connectTimeout,
    keepalive,
    clean,
    rejectUnauthorized,
  });

  mqttClient.on('connect', () => {
    console.log('MQTT connected');
    mqttClient!.subscribe('beehayb/sensor/+/data', (err) => {
      if (err) {
        console.error('MQTT subscription error:', err);
      } else {
        console.log('Subscribed to sensor data topic');
      }
    });
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      const payload: MqttPayload = JSON.parse(message.toString());
      console.log('MQTT message received:', payload);

      // Update device last seen
      const device = await DeviceModel.findBySerial(payload.esp32_serial);
      if (device) {
        await DeviceModel.updateLastSeen(device.id);
      }

      // Calculate bee stress
      const beeStress = calculateBeeStress(payload.sound_level);

      // Store sensor reading
      const reading = await SensorReadingModel.create(
        payload.hive_id,
        payload.temperature,
        payload.humidity,
        payload.sound_level,
        beeStress,
        device?.id
      );

      console.log('Sensor reading stored:', reading);

      // Call callback if provided
      if (onMessageCallback) {
        onMessageCallback(reading);
      }
    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  });

  mqttClient.on('error', (error) => {
    console.error('MQTT error:', error);
  });

  mqttClient.on('reconnect', () => {
    console.log('MQTT reconnecting...');
  });

  mqttClient.on('offline', () => {
    console.log('MQTT offline');
  });

  mqttClient.on('disconnect', () => {
    console.log('MQTT disconnected');
  });

  mqttClient.on('close', () => {
    console.log('MQTT connection closed');
  });
};

export const publishToMqtt = (topic: string, message: any) => {
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(topic, JSON.stringify(message));
  } else {
    console.warn('MQTT client not connected');
  }
};

export const getMqttClient = () => mqttClient;

export const closeMqtt = async () => {
  if (mqttClient) {
    await new Promise<void>((resolve) => {
      mqttClient!.end(false, () => resolve());
    });
    mqttClient = null;
    console.log('MQTT client closed');
  }
};
