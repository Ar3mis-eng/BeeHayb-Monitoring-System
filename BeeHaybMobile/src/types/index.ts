export type BeeStressLevel = 'Healthy' | 'Warning' | 'Critical';

export interface Hive {
  id: number;
  hive_name: string;
  location: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Device {
  id: number;
  device_name: string;
  esp32_serial: string;
  hive_id: number;
  status: string;
  last_seen: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SensorReading {
  id: number;
  hive_id: number;
  device_id?: number;
  temperature?: number;
  humidity?: number;
  sound_level?: number;
  bee_stress_status: BeeStressLevel;
  recorded_at: Date;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MetricValue {
  value: number;
  unit: string;
  trend: number;
  status: BeeStressLevel;
  lastUpdate: Date;
}

export interface HiveStatus {
  hive: Hive;
  temperature: MetricValue;
  humidity: MetricValue;
  soundLevel: MetricValue;
  lastSync: Date;
  connectionStatus: 'Connected' | 'Disconnected';
  sensorSource: 'Mock' | 'WiFi' | 'MQTT' | 'Bluetooth';
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
}
