import { BeeStressLevel } from '../types';

export const getStressColor = (stress: BeeStressLevel): string => {
  switch (stress) {
    case 'Healthy':
      return '#6BA36F';
    case 'Warning':
      return '#D9A25F';
    case 'Critical':
      return '#D9534F';
    default:
      return '#2E2E2E';
  }
};

export const getStressIcon = (stress: BeeStressLevel): string => {
  switch (stress) {
    case 'Healthy':
      return '✓';
    case 'Warning':
      return '⚠';
    case 'Critical':
      return '✕';
    default:
      return '?';
  }
};

export const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return current - previous;
};

export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString();
};

export const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString();
};

export const formatMetricValue = (value: number | string | null | undefined, decimals: number = 1): string => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return '0.0';
  }

  return numericValue.toFixed(decimals);
};

export const generateMockSensorData = (hiveId: number, count: number = 24) => {
  const data = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      id: i,
      hive_id: hiveId,
      temperature: 28 + Math.random() * 8,
      humidity: 55 + Math.random() * 20,
      sound_level: 45 + Math.random() * 35,
      bee_stress_status: 'Healthy' as const,
      recorded_at: timestamp,
    });
  }

  return data;
};
