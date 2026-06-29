import mqtt, { MqttClient } from 'mqtt';
import { SensorReadingModel } from '../models/SensorReading';
import { DeviceModel } from '../models/Device';
import { calculateBeeStress } from '../utils/beeStress';

let mqttClient: MqttClient | null = null;

export interface MqttPayload {
  esp32_serial: string;
  hive_id: number;
  temperature: number;
  humidity: number;
  sound_level: number;
  timestamp: number;
}

export const initMqtt = async (onMessageCallback?: (payload: MqttPayload) => void) => {
  const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
  const username = process.env.MQTT_USER || 'beehayb_user';
  const password = process.env.MQTT_PASS || 'beehayb_pass';

  mqttClient = mqtt.connect(brokerUrl, {
    username,
    password,
    clientId: 'beehayb-backend',
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
        onMessageCallback(payload);
      }
    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  });

  mqttClient.on('error', (error) => {
    console.error('MQTT error:', error);
  });

  mqttClient.on('disconnect', () => {
    console.log('MQTT disconnected');
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
    return new Promise((resolve) => {
      mqttClient!.end(false, resolve);
    });
  }
};
