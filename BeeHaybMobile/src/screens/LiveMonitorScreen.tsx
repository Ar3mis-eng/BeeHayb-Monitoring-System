import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from 'react-native';
import Header from '../components/Header';
import LiveStatusCard from '../components/LiveStatusCard';
import MetricCard from '../components/MetricCard';
import { useSensorReadings } from '../hooks/useSensorData';
import { useHiveStore } from '../utils/store';
import { SensorReading } from '../types';

const UNABLE_TO_DETECT_OTHER_DEVICES = 'Unable to detect other devices';

const LiveMonitorScreen: React.FC = () => {
  const selectedHiveId = useHiveStore((state) => state.selectedHiveId);
  const hives = useHiveStore((state) => state.hives);
  const selectedHive = hives.find((hive) => hive.id === selectedHiveId);
  const hiveId = selectedHiveId ?? 1;
  const { latestReading, loading, error } = useSensorReadings(hiveId, 1000);

  const [metrics, setMetrics] = useState({
    temperature: { value: 0, trend: 0, status: 'Healthy' as const },
    humidity: { value: 0, trend: 0, status: 'Healthy' as const },
    soundLevel: { value: 0, trend: 0, status: 'Healthy' as const },
  });

  useEffect(() => {
    if (latestReading) {
      setMetrics((prev) => ({
        ...prev,
        temperature: {
          value: Number(latestReading.temperature) || 0,
          trend: 0.3,
          status: latestReading.bee_stress_status,
        },
        humidity: {
          value: Number(latestReading.humidity) || 0,
          trend: 0.5,
          status: 'Healthy',
        },
        soundLevel: {
          value: Number(latestReading.sound_level) || 0,
          trend: 4,
          status: latestReading.bee_stress_status,
        },
      }));
    }
  }, [latestReading]);

  if (loading && !latestReading) {
    return (
      <View style={styles.container}>
        <Header
          hiveName={selectedHive?.hive_name || UNABLE_TO_DETECT_OTHER_DEVICES}
          connectionStatus="Connected"
          sensorSource="MQTT"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D9A25F" />
          <Text style={styles.loadingText}>Loading sensor data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header
          hiveName={selectedHive?.hive_name || UNABLE_TO_DETECT_OTHER_DEVICES}
          connectionStatus="Disconnected"
          sensorSource="Mock"
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        hiveName={selectedHive?.hive_name || UNABLE_TO_DETECT_OTHER_DEVICES}
        connectionStatus="Connected"
        sensorSource="MQTT"
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <LiveStatusCard lastSyncTime={new Date()} sensorSource="MQTT" />

        <Text style={styles.sectionTitle}>Hive Metrics</Text>

        <MetricCard
          title="Temperature"
          value={metrics.temperature.value}
          unit="°C"
          trend={metrics.temperature.trend}
          status={metrics.temperature.status}
          trendUnit="/hr"
          decimals={2}
        />

        <MetricCard
          title="Humidity"
          value={metrics.humidity.value}
          unit="%"
          trend={metrics.humidity.trend}
          status={metrics.humidity.status}
          trendUnit="/hr"
          decimals={2}
        />

        <MetricCard
          title="Sound Level"
          value={metrics.soundLevel.value}
          unit="dB"
          trend={metrics.soundLevel.trend}
          status={metrics.soundLevel.status}
          trendUnit="/hr"
          decimals={1}
        />

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#2E2E2E',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#D9534F',
    fontSize: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2E2E',
    marginLeft: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  spacer: {
    height: 20,
  },
});

export default LiveMonitorScreen;
