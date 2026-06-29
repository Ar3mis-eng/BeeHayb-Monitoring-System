import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator } from 'react-native';
import TrendChart from '../charts/TrendChart';
import { sensorService } from '../services/api';
import { useHiveStore } from '../utils/store';
import { ChartDataPoint } from '../types';

const UNABLE_TO_DETECT_OTHER_DEVICES = 'Unable to detect other devices';
const MAX_POINTS = 20;

const TrendsScreen: React.FC = () => {
  const [selectedHiveId, setSelectedHiveId] = useState<number>(() => useHiveStore.getState().selectedHiveId ?? 1);
  const [hives, setHives] = useState(() => useHiveStore.getState().hives ?? []);

  const [temperatureData, setTemperatureData] = useState<ChartDataPoint[]>([]);
  const [humidityData, setHumidityData] = useState<ChartDataPoint[]>([]);
  const [soundLevelData, setSoundLevelData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = useHiveStore.subscribe((state) => {
      setSelectedHiveId(state.selectedHiveId ?? 1);
      setHives(state.hives ?? []);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setTemperatureData([]);
    setHumidityData([]);
    setSoundLevelData([]);

    const fetchLatestReading = async () => {
      try {
        const latestReading = await sensorService.getLatestSensorReadingByHive(selectedHiveId);

        if (!active || !latestReading) {
          return;
        }

        const timestamp = new Date(latestReading.recorded_at || new Date());
        const appendSample = (previous: ChartDataPoint[], value: number) =>
          [...previous, { timestamp, value }].slice(-MAX_POINTS);

        setTemperatureData((previous) => appendSample(previous, Number(latestReading.temperature) || 0));
        setHumidityData((previous) => appendSample(previous, Number(latestReading.humidity) || 0));
        setSoundLevelData((previous) => appendSample(previous, Number(latestReading.sound_level) || 0));
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch trends');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchLatestReading();
    const interval = setInterval(fetchLatestReading, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedHiveId]);

  const selectedHive = hives.find((hive) => hive.id === selectedHiveId);

  if (loading && temperatureData.length === 0 && humidityData.length === 0 && soundLevelData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Real-Time Trends</Text>
          <Text style={styles.headerSubtitle}>{selectedHive?.hive_name || UNABLE_TO_DETECT_OTHER_DEVICES}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D9A25F" />
        </View>
      </View>
    );
  }

  if (error && temperatureData.length === 0 && humidityData.length === 0 && soundLevelData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Real-Time Trends</Text>
          <Text style={styles.headerSubtitle}>{selectedHive?.hive_name || UNABLE_TO_DETECT_OTHER_DEVICES}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'No data available'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Real-Time Trends</Text>
        <Text style={styles.headerSubtitle}>{selectedHive?.hive_name || UNABLE_TO_DETECT_OTHER_DEVICES}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {temperatureData.length > 0 && (
          <TrendChart title="Temperature Trend" data={temperatureData} color="#FF6B6B" unit="°C" decimals={2} />
        )}

        {humidityData.length > 0 && (
          <TrendChart title="Humidity Trend" data={humidityData} color="#4ECDC4" unit="%" decimals={2} />
        )}

        {soundLevelData.length > 0 && (
          <TrendChart title="Sound Level Trend" data={soundLevelData} color="#FFE66D" unit="dB" decimals={1} />
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F0',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3DB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D9A25F',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#D9534F',
    fontSize: 16,
  },
  errorBanner: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FBE9E7',
  },
  spacer: {
    height: 20,
  },
});

export default TrendsScreen;
