import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, Hive, Device, SensorReading, User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://10.0.2.2:5000/api';
const LOCAL_USERS_KEY = 'beehaybLocalUsers';
const CURRENT_USER_KEY = 'beehaybCurrentUser';

type LocalUserRecord = {
  id: number;
  username: string;
  email: string;
  password: string;
};

const readLocalUsers = async (): Promise<Record<string, LocalUserRecord>> => {
  const storedUsers = await AsyncStorage.getItem(LOCAL_USERS_KEY);
  return storedUsers ? JSON.parse(storedUsers) : {};
};

const writeLocalUsers = async (users: Record<string, LocalUserRecord>) => {
  await AsyncStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const saveLocalSession = async (user: User) => {
  const token = `local-${user.id}-${Date.now()}`;
  await AsyncStorage.setItem('authToken', token);
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return token;
};

const createAxiosInstance = async (): Promise<AxiosInstance> => {
  const token = await AsyncStorage.getItem('authToken');

  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
};

// Auth Service
export const authService = {
  async register(username: string, email: string, password: string): Promise<User> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      const users = await readLocalUsers();

      if (users[username]) {
        throw new Error('Username already exists');
      }

      const user: User = {
        id: Date.now(),
        username,
        email,
      };

      users[username] = {
        ...user,
        password,
      };

      await writeLocalUsers(users);
      await saveLocalSession(user);
      return user;
    }
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });
      const { token } = response.data;
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      const users = await readLocalUsers();
      const localUser = users[username];

      if (!localUser || localUser.password !== password) {
        throw error;
      }

      const user: User = {
        id: localUser.id,
        username: localUser.username,
        email: localUser.email,
      };
      const token = await saveLocalSession(user);

      return {
        token,
        user,
      };
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const api = await createAxiosInstance();
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      const storedUser = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (!storedUser) {
        throw error;
      }
      return JSON.parse(storedUser);
    }
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  },
};

// Hive Service
export const hiveService = {
  async getAllHives(): Promise<Hive[]> {
    const api = await createAxiosInstance();
    const response = await api.get('/hives');
    return response.data;
  },

  async getHiveById(id: number): Promise<Hive> {
    const api = await createAxiosInstance();
    const response = await api.get(`/hives/${id}`);
    return response.data;
  },

  async createHive(hiveName: string, location: string, description?: string): Promise<Hive> {
    const api = await createAxiosInstance();
    const response = await api.post('/hives', {
      hiveName,
      location,
      description,
    });
    return response.data;
  },

  async updateHive(id: number, hiveName: string, location: string, description?: string): Promise<Hive> {
    const api = await createAxiosInstance();
    const response = await api.put(`/hives/${id}`, {
      hiveName,
      location,
      description,
    });
    return response.data;
  },

  async deleteHive(id: number): Promise<void> {
    const api = await createAxiosInstance();
    await api.delete(`/hives/${id}`);
  },
};

// Device Service
export const deviceService = {
  async getAllDevices(): Promise<Device[]> {
    const api = await createAxiosInstance();
    const response = await api.get('/devices');
    return response.data;
  },

  async getDeviceById(id: number): Promise<Device> {
    const api = await createAxiosInstance();
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },

  async getDevicesByHive(hiveId: number): Promise<Device[]> {
    const api = await createAxiosInstance();
    const response = await api.get(`/devices/hive/${hiveId}`);
    return response.data;
  },

  async createDevice(deviceName: string, esp32Serial: string, hiveId: number, status?: string): Promise<Device> {
    const api = await createAxiosInstance();
    const response = await api.post('/devices', {
      deviceName,
      esp32Serial,
      hiveId,
      status: status || 'active',
    });
    return response.data;
  },

  async updateDevice(id: number, deviceName: string, status: string): Promise<Device> {
    const api = await createAxiosInstance();
    const response = await api.put(`/devices/${id}`, {
      deviceName,
      status,
    });
    return response.data;
  },

  async deleteDevice(id: number): Promise<void> {
    const api = await createAxiosInstance();
    await api.delete(`/devices/${id}`);
  },
};

// Sensor Service
export const sensorService = {
  async getSensorReadings(): Promise<SensorReading[]> {
    const api = await createAxiosInstance();
    const response = await api.get('/sensors');
    return response.data;
  },

  async getSensorReadingsByHive(hiveId: number, limit?: number): Promise<SensorReading[]> {
    const api = await createAxiosInstance();
    const response = await api.get(`/sensors/hive/${hiveId}`, {
      params: { limit: limit || 100 },
    });
    return response.data;
  },

  async getLatestSensorReadingByHive(hiveId: number): Promise<SensorReading> {
    const api = await createAxiosInstance();
    const response = await api.get(`/sensors/hive/${hiveId}/latest`);
    return response.data;
  },

  async getSensorReadingsByTimeRange(
    hiveId: number,
    startTime: Date,
    endTime: Date,
    limit?: number
  ): Promise<SensorReading[]> {
    const api = await createAxiosInstance();
    const response = await api.get(`/sensors/hive/${hiveId}/range`, {
      params: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        limit: limit || 1000,
      },
    });
    return response.data;
  },

  async createSensorReading(
    hiveId: number,
    temperature: number,
    humidity: number,
    soundLevel: number,
    deviceId?: number
  ): Promise<SensorReading> {
    const api = await createAxiosInstance();
    const response = await api.post('/sensors', {
      hiveId,
      temperature,
      humidity,
      soundLevel,
      deviceId,
    });
    return response.data;
  },
};
