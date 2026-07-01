import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, Modal, Pressable } from 'react-native';
import Header from '../components/Header';
import HiveSelector from '../components/HiveSelector';
import LiveStatusCard from '../components/LiveStatusCard';
import MetricCard from '../components/MetricCard';
import BeeLoader from '../components/BeeLoader';
import { useSensorReadings } from '../hooks/useSensorData';
import { useHiveStore } from '../utils/store';
import { BeeStressLevel } from '../types';
import {
  buildHiveAnalytics,
  buildMetricInsights,
  buildPersistedHiveBaseline,
  loadPersistedHiveBaseline,
  MetricInsight,
  PersistedHiveBaseline,
  savePersistedHiveBaseline,
} from '../utils/analytics';

const FAILED_RETRIEVE_DATA = 'Failed to retrieve data';

const resolveHiveName = (
  selectedHiveId: number | null,
  hives: ReturnType<typeof useHiveStore.getState>['hives']
): string => {
  const selectedHive = hives.find((hive) => hive.id === selectedHiveId);
  if (selectedHive) {
    return selectedHive.hive_name;
  }

  if (selectedHiveId === 1) {
    return 'Hive Alpha';
  }

  return FAILED_RETRIEVE_DATA;
};

const statusFromReading = (value: number): BeeStressLevel => {
  if (value >= 76) {
    return 'Critical';
  }

  if (value >= 61) {
    return 'Warning';
  }

  return 'Healthy';
};

interface MetricState {
  value: number;
  trend: number;
  status: BeeStressLevel;
}

interface MetricsState {
  temperature: MetricState;
  humidity: MetricState;
  soundLevel: MetricState;
}

type MetricKey = 'temperature' | 'humidity' | 'soundLevel' | 'stressIndex';

const LiveMonitorScreen: React.FC = () => {
  const selectedHiveId = useHiveStore((state) => state.selectedHiveId);
  const setSelectedHiveId = useHiveStore((state) => state.setSelectedHiveId);
  const hives = useHiveStore((state) => state.hives);
  const hiveId = selectedHiveId ?? 1;
  const { readings, latestReading, loading, error } = useSensorReadings(hiveId, 1000);
  const hiveName = resolveHiveName(selectedHiveId, hives);
  const hasData = Boolean(latestReading);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);
  const [persistedBaseline, setPersistedBaseline] = useState<PersistedHiveBaseline | null>(null);

  const [metrics, setMetrics] = useState<MetricsState>({
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
          status: statusFromReading(Number(latestReading.sound_level) || 0),
        },
        soundLevel: {
          value: Number(latestReading.sound_level) || 0,
          trend: 4,
          status: latestReading.bee_stress_status,
        },
      }));
    }
  }, [latestReading]);

  useEffect(() => {
    let active = true;

    const loadBaseline = async () => {
      const baseline = await loadPersistedHiveBaseline(hiveId);
      if (active) {
        setPersistedBaseline(baseline);
      }
    };

    void loadBaseline();

    return () => {
      active = false;
    };
  }, [hiveId]);

  useEffect(() => {
    if (readings.length < 8) {
      return;
    }

    const selectedHiveReadings = readings.filter((reading) => reading.hive_id === hiveId);
    if (selectedHiveReadings.length < 8) {
      return;
    }

    const baseline = buildPersistedHiveBaseline(hiveId, selectedHiveReadings);
    setPersistedBaseline(baseline);
    void savePersistedHiveBaseline(baseline);
  }, [hiveId, readings]);

  const selectedHiveReadings = readings.filter((reading) => reading.hive_id === hiveId);
  const hiveAnalytics = buildHiveAnalytics(selectedHiveReadings, persistedBaseline ?? undefined);
  const stressIndex = hiveAnalytics.stressIndex;
  const metricInsights: Record<MetricKey, MetricInsight> = buildMetricInsights(hiveAnalytics);

  const activeInsight = selectedMetric ? metricInsights[selectedMetric] : null;
  const lastSyncTime = latestReading?.recorded_at ? new Date(latestReading.recorded_at) : new Date();

  if (loading && !latestReading) {
    return (
      <View style={styles.container}>
        <Header
          hiveName={hiveName}
          connectionStatus="Connected"
          sensorSource="MQTT"
        />
        <View style={styles.loadingContainer}>
          <BeeLoader label="Preparing live hive feed" />
        </View>
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={styles.container}>
        <Header
          hiveName={hiveName}
          connectionStatus="Disconnected"
          sensorSource="MQTT"
        />
        <HiveSelector
          hives={hives}
          selectedHiveId={selectedHiveId}
          onSelectHive={setSelectedHiveId}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{FAILED_RETRIEVE_DATA}</Text>
          {error ? <Text style={styles.errorSubText}>{error}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        hiveName={hiveName}
        connectionStatus="Connected"
        sensorSource="MQTT"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <HiveSelector
          hives={hives}
          selectedHiveId={selectedHiveId}
          onSelectHive={setSelectedHiveId}
        />

        <LiveStatusCard lastSyncTime={lastSyncTime} sensorSource="MQTT" />

        <Text style={styles.sectionTitle}>Hive Metrics</Text>

        <View style={styles.metricGrid}>
          <MetricCard
            title="Temp"
            value={metrics.temperature.value}
            unit="°C"
            trend={metrics.temperature.trend}
            status={metrics.temperature.status}
            trendUnit="/hr"
            decimals={1}
            detailHint="Tap for thermal analysis"
            onPress={() => setSelectedMetric('temperature')}
            style={styles.metricGridCard}
          />

          <MetricCard
            title="Humidity"
            value={metrics.humidity.value}
            unit="%"
            trend={metrics.humidity.trend}
            status={metrics.humidity.status}
            trendUnit="/hr"
            decimals={1}
            detailHint="Tap for moisture analysis"
            onPress={() => setSelectedMetric('humidity')}
            style={styles.metricGridCard}
          />

          <MetricCard
            title="Sound Level"
            value={metrics.soundLevel.value}
            unit="dB"
            trend={metrics.soundLevel.trend}
            status={metrics.soundLevel.status}
            trendUnit="/hr"
            decimals={1}
            detailHint="Tap for acoustic analysis"
            onPress={() => setSelectedMetric('soundLevel')}
            style={styles.metricGridCard}
          />

          <MetricCard
            title="Stress Index"
            value={stressIndex}
            unit="/100"
            trend={Math.max(0, metrics.soundLevel.trend / 2)}
            status={latestReading?.bee_stress_status ?? 'Healthy'}
            trendUnit=" index/hr"
            decimals={0}
            detailHint="Tap for colony interpretation"
            onPress={() => setSelectedMetric('stressIndex')}
            style={styles.metricGridCard}
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={Boolean(activeInsight)}
        onRequestClose={() => setSelectedMetric(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{activeInsight?.title}</Text>
                <Text style={styles.modalCurrent}>{activeInsight?.current}</Text>
              </View>
              <Pressable onPress={() => setSelectedMetric(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.insightBlock}>
                <Text style={styles.insightLabel}>Snapshot</Text>
                <Text style={styles.insightText}>{activeInsight?.summary}</Text>
              </View>

              <View style={styles.insightBlock}>
                <Text style={styles.insightLabel}>Interpretation</Text>
                <Text style={styles.insightText}>{activeInsight?.interpretation}</Text>
              </View>

              {activeInsight?.eventLabels.length ? (
                <View style={styles.insightBlock}>
                  <Text style={styles.insightLabel}>Detected Events</Text>
                  <View style={styles.eventChipRow}>
                    {activeInsight.eventLabels.map((label) => (
                      <View key={label} style={styles.eventChip}>
                        <Text style={styles.eventChipText}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.insightBlock}>
                <Text style={styles.insightLabel}>Effect On Bees</Text>
                <Text style={styles.insightText}>{activeInsight?.beeImpact}</Text>
              </View>

              <View style={styles.insightBlock}>
                <Text style={styles.insightLabel}>Recommended Action</Text>
                <Text style={styles.insightText}>{activeInsight?.action}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 24,
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
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#D9534F',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorSubText: {
    color: '#8A8377',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E2E2E',
    marginLeft: 14,
    marginTop: 18,
    marginBottom: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  metricGridCard: {
    width: '48.5%',
    marginBottom: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(22, 18, 13, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '76%',
    backgroundColor: '#FFFDF8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#241F17',
  },
  modalCurrent: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#7C6A4D',
  },
  closeButton: {
    backgroundColor: '#F3E3C8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#6A4E1F',
    fontSize: 13,
    fontWeight: '800',
  },
  insightBlock: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FBF5E9',
    borderWidth: 1,
    borderColor: '#E7D7BA',
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A6C3A',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#372F24',
  },
  eventChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  eventChip: {
    backgroundColor: '#F2E2BF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  eventChipText: {
    color: '#6B5122',
    fontSize: 12,
    fontWeight: '800',
  },
  spacer: {
    height: 8,
  },
});

export default LiveMonitorScreen;
