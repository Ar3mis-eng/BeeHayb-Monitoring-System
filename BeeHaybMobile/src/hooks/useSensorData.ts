import { useEffect, useState } from 'react';
import { SensorReading } from '../types';
import { sensorService } from '../services/api';
import { subscribeToHive, unsubscribeFromHive } from '../services/websocket';
import { useSensorStore } from '../utils/store';

export const useSensorReadings = (hiveId: number, refreshInterval: number = 1000) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readings = useSensorStore((state) => state.readings);
  const addReading = useSensorStore((state) => state.addReading);
  const latestReading = useSensorStore((state) => state.getLatestReading(hiveId));

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        setLoading(true);
        const data = await sensorService.getSensorReadingsByHive(hiveId, 100);
        useSensorStore.setState({ readings: data });
        if (data.length > 0) {
          useSensorStore.getState().setLatestReading(hiveId, data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch readings');
      } finally {
        setLoading(false);
      }
    };

    fetchReadings();

    const interval = setInterval(fetchReadings, refreshInterval);

    return () => clearInterval(interval);
  }, [hiveId, refreshInterval]);

  useEffect(() => {
    subscribeToHive(hiveId, (reading) => {
      addReading(reading);
      useSensorStore.getState().setLatestReading(hiveId, reading);
    });

    return () => {
      unsubscribeFromHive(hiveId);
    };
  }, [hiveId, addReading]);

  return { readings, latestReading, loading, error };
};

export const useLatestSensorReading = (hiveId: number) => {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestReading = async () => {
      try {
        setLoading(true);
        const data = await sensorService.getLatestSensorReadingByHive(hiveId);
        setReading(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reading');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestReading();

    const interval = setInterval(fetchLatestReading, 1000);

    return () => clearInterval(interval);
  }, [hiveId]);

  return { reading, loading, error };
};

export const useSensorReadingHistory = (hiveId: number, days: number = 1) => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);
        const data = await sensorService.getSensorReadingsByTimeRange(hiveId, startTime, endTime);
        setReadings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [hiveId, days]);

  return { readings, loading, error };
};
