import { create } from 'zustand';
import { User, Hive, Device, SensorReading } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  setUser: (user: User | null) => set({ user }),
  setToken: (token: string | null) => set({ token }),
  isAuthenticated: () => !!get().token,
}));

interface HiveState {
  hives: Hive[];
  selectedHiveId: number | null;
  setHives: (hives: Hive[]) => void;
  addHive: (hive: Hive) => void;
  removeHive: (id: number) => void;
  setSelectedHiveId: (id: number | null) => void;
  getSelectedHive: () => Hive | undefined;
}

export const useHiveStore = create<HiveState>((set, get) => ({
  hives: [],
  selectedHiveId: null,
  setHives: (hives: Hive[]) => set({ hives }),
  addHive: (hive: Hive) => set((state) => ({ hives: [...state.hives, hive] })),
  removeHive: (id: number) =>
    set((state) => ({
      hives: state.hives.filter((h) => h.id !== id),
    })),
  setSelectedHiveId: (id: number | null) => set({ selectedHiveId: id }),
  getSelectedHive: () => {
    const { hives, selectedHiveId } = get();
    return selectedHiveId ? hives.find((h) => h.id === selectedHiveId) : undefined;
  },
}));

interface SensorState {
  readings: SensorReading[];
  latestReadings: Map<number, SensorReading>;
  setReadings: (readings: SensorReading[]) => void;
  addReading: (reading: SensorReading) => void;
  setLatestReading: (hiveId: number, reading: SensorReading) => void;
  getLatestReading: (hiveId: number) => SensorReading | undefined;
}

export const useSensorStore = create<SensorState>((set, get) => ({
  readings: [],
  latestReadings: new Map(),
  setReadings: (readings: SensorReading[]) => set({ readings }),
  addReading: (reading: SensorReading) =>
    set((state) => ({
      readings: [reading, ...state.readings],
    })),
  setLatestReading: (hiveId: number, reading: SensorReading) =>
    set((state) => {
      const newMap = new Map(state.latestReadings);
      newMap.set(hiveId, reading);
      return { latestReadings: newMap };
    }),
  getLatestReading: (hiveId: number) => {
    return get().latestReadings.get(hiveId);
  },
}));

interface DeviceState {
  devices: Device[];
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  removeDevice: (id: number) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  setDevices: (devices: Device[]) => set({ devices }),
  addDevice: (device: Device) => set((state) => ({ devices: [...state.devices, device] })),
  removeDevice: (id: number) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== id),
    })),
}));
