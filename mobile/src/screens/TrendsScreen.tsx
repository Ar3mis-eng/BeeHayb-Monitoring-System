import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator } from 'react-native';
import TrendChart from '../charts/TrendChart';
import { useSensorReadingHistory } from '../hooks/useSensorData';
import { useHiveStore } from '../utils/store';
import { ChartDataPoint } from '../types';

const TrendsScreen: React.FC = () => {
  const selectedHiveId = useHiveStore((state) => state.selectedHiveId);
  const selectedHive = useHiveStore((state) => state.getSelectedHive());
  const { readings, loading, error } = useSensorReadingHistory(selectedHiveId || 1, 1);

  const [temperatureData, setTemperatureData] = useState<ChartDataPoint[]>([]);
  const [humidityData, setHumidityData] = useState<ChartDataPoint[]>([]);
  const [soundLevelData, setSoundLevelData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (readings && readings.length > 0) {
      const tempData = readings
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        .map((r) => ({
          timestamp: new Date(r.recorded_at),
          value: r.temperature || 0,
        }));

      const humData = readings
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        .map((r) => ({
          timestamp: new Date(r.recorded_at),
          value: r.humidity || 0,
        }));

      const soundData = readings
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        .map((r) => ({
          timestamp: new Date(r.recorded_at),
          value: r.sound_level || 0,
        }));

      setTemperatureData(tempData);
      setHumidityData(humData);
      setSoundLevelData(soundData);
    }
  }, [readings]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>24-Hour Trends</Text>
          <Text style={styles.headerSubtitle}>{selectedHive?.hive_name || 'Hive Alpha'}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D9A25F" />
        </View>
      </View>
    );
  }

  if (error || temperatureData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>24-Hour Trends</Text>
          <Text style={styles.headerSubtitle}>{selectedHive?.hive_name || 'Hive Alpha'}</Text>
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
        <Text style={styles.headerTitle}>24-Hour Trends</Text>
        <Text style={styles.headerSubtitle}>{selectedHive?.hive_name || 'Hive Alpha'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {temperatureData.length > 0 && (
          <TrendChart title="Temperature Trend" data={temperatureData} color="#FF6B6B" unit="°C" />
        )}

        {humidityData.length > 0 && (
          <TrendChart title="Humidity Trend" data={humidityData} color="#4ECDC4" unit="%" />
        )}

        {soundLevelData.length > 0 && (
          <TrendChart title="Sound Level Trend" data={soundLevelData} color="#FFE66D" unit="dB" />
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
  spacer: {
    height: 20,
  },
});

export default TrendsScreen;
