import React, { useEffect, useState } from 'react';
import { Pressable, View, ScrollView, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TrendChart from '../charts/TrendChart';
import Header from '../components/Header';
import HiveSelector from '../components/HiveSelector';
import { sensorService } from '../services/api';
import { useHiveStore } from '../utils/store';
import { ChartDataPoint, SensorReading } from '../types';
import {
  AnalyticsTimelineEvent,
  buildEventTimeline,
  buildPersistedHiveBaseline,
  savePersistedHiveBaseline,
} from '../utils/analytics';
import { formatTime, getStressColor } from '../utils/helpers';

const FAILED_RETRIEVE_DATA = 'Failed to retrieve data';
const MAX_POINTS = 20;
const CHART_ZOOM_LEVELS = {
  compact: 0.9,
  wide: 1.4,
  detail: 2.1,
} as const;

type ChartZoomKey = keyof typeof CHART_ZOOM_LEVELS;

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

const TrendsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedHiveId, setSelectedHiveId] = useState<number>(() => useHiveStore.getState().selectedHiveId ?? 1);
  const setSelectedHive = useHiveStore((state) => state.setSelectedHiveId);
  const [hives, setHives] = useState(() => useHiveStore.getState().hives ?? []);
  const [chartZoom, setChartZoom] = useState<ChartZoomKey>('wide');

  const [temperatureData, setTemperatureData] = useState<ChartDataPoint[]>([]);
  const [humidityData, setHumidityData] = useState<ChartDataPoint[]>([]);
  const [soundLevelData, setSoundLevelData] = useState<ChartDataPoint[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<AnalyticsTimelineEvent[]>([]);
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

    const fetchReadings = async () => {
      try {
        const readingHistory = await sensorService.getSensorReadingsByHive(selectedHiveId, 48);

        if (!active || readingHistory.length === 0) {
          return;
        }

        const orderedReadings = [...readingHistory].sort(
          (left, right) => new Date(left.recorded_at).getTime() - new Date(right.recorded_at).getTime()
        );
        const toChartData = (readings: SensorReading[], selector: (reading: SensorReading) => number) =>
          readings.slice(-MAX_POINTS).map((reading) => ({
            timestamp: new Date(reading.recorded_at),
            value: selector(reading),
          }));

        setTemperatureData(toChartData(orderedReadings, (reading) => Number(reading.temperature) || 0));
        setHumidityData(toChartData(orderedReadings, (reading) => Number(reading.humidity) || 0));
        setSoundLevelData(toChartData(orderedReadings, (reading) => Number(reading.sound_level) || 0));

        const baseline = buildPersistedHiveBaseline(selectedHiveId, orderedReadings);
        void savePersistedHiveBaseline(baseline);
        setTimelineEvents(buildEventTimeline(selectedHiveId, orderedReadings, baseline));
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : FAILED_RETRIEVE_DATA);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchReadings();
    const interval = setInterval(() => {
      void fetchReadings();
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedHiveId]);

  const hiveName = resolveHiveName(selectedHiveId, hives);
  const hasAnyData = temperatureData.length > 0 || humidityData.length > 0 || soundLevelData.length > 0;

  if (loading && temperatureData.length === 0 && humidityData.length === 0 && soundLevelData.length === 0) {
    return (
      <View style={styles.container}>
        <Header
          hiveName={hiveName}
          connectionStatus="Connected"
          sensorSource="MQTT"
        />
        <HiveSelector hives={hives} selectedHiveId={selectedHiveId} onSelectHive={setSelectedHive} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D9A25F" />
        </View>
      </View>
    );
  }

  if (!hasAnyData && !loading) {
    return (
      <View style={styles.container}>
        <Header
          hiveName={hiveName}
          connectionStatus="Disconnected"
          sensorSource="MQTT"
        />
        <HiveSelector hives={hives} selectedHiveId={selectedHiveId} onSelectHive={setSelectedHive} />
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
      <HiveSelector hives={hives} selectedHiveId={selectedHiveId} onSelectHive={setSelectedHive} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {error && !hasAnyData ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {timelineEvents.length > 0 ? (
          <View style={styles.timelineCard}>
            <View style={styles.timelineTitleRow}>
              <View style={styles.timelineTitleWrap}>
                <Text style={styles.timelineTitle}>Event Timeline</Text>
                <Text style={styles.timelineSubtitle}>Detected colony events aligned with recent telemetry behavior</Text>
              </View>
              <Pressable
                style={styles.historyButton}
                onPress={() => navigation.navigate('AnalyticsHistory', { hiveId: selectedHiveId, hiveName })}
              >
                <Text style={styles.historyButtonText}>Full History</Text>
              </Pressable>
            </View>

            {timelineEvents.map((event) => (
              <View key={`${event.label}-${event.detectedAt.toISOString()}`} style={styles.timelineRow}>
                <View style={[styles.timelineScore, { backgroundColor: getStressColor(event.severity) }]}>
                  <Text style={styles.timelineScoreText}>{event.score}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineEventLabel}>{event.label}</Text>
                    <Text style={styles.timelineTime}>{formatTime(event.detectedAt)}</Text>
                  </View>
                  <Text style={styles.timelineEventText}>{event.message}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.zoomCard}>
          <View style={styles.zoomHeader}>
            <Text style={styles.zoomTitle}>Chart Scale</Text>
            <Text style={styles.zoomSubtitle}>Default is wider. Switch views for compact or more detailed inspection.</Text>
          </View>
          <View style={styles.zoomRow}>
            {(['compact', 'wide', 'detail'] as ChartZoomKey[]).map((zoomKey) => {
              const selected = chartZoom === zoomKey;
              const label = zoomKey === 'compact' ? 'Compact' : zoomKey === 'wide' ? 'Wide' : 'Detailed';
              return (
                <Pressable
                  key={zoomKey}
                  style={[styles.zoomButton, selected && styles.zoomButtonActive]}
                  onPress={() => setChartZoom(zoomKey)}
                >
                  <Text style={[styles.zoomButtonText, selected && styles.zoomButtonTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {temperatureData.length > 0 && (
          <TrendChart title="Temperature Trend" data={temperatureData} color="#FF6B6B" unit="°C" decimals={2} events={timelineEvents} zoomLevel={CHART_ZOOM_LEVELS[chartZoom]} />
        )}

        {humidityData.length > 0 && (
          <TrendChart title="Humidity Trend" data={humidityData} color="#4ECDC4" unit="%" decimals={2} events={timelineEvents} zoomLevel={CHART_ZOOM_LEVELS[chartZoom]} />
        )}

        {soundLevelData.length > 0 && (
          <TrendChart title="Sound Level Trend" data={soundLevelData} color="#FFE66D" unit="dB" decimals={1} events={timelineEvents} zoomLevel={CHART_ZOOM_LEVELS[chartZoom]} />
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    fontWeight: '700',
  },
  errorSubText: {
    marginTop: 8,
    color: '#8A8377',
    fontSize: 13,
    textAlign: 'center',
  },
  errorBanner: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FBE9E7',
  },
  timelineCard: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#E9DFCF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A241B',
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timelineTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  timelineSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7D7366',
    fontWeight: '600',
  },
  historyButton: {
    backgroundColor: '#F3E3C8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E6CCA1',
  },
  historyButtonText: {
    color: '#6D5123',
    fontSize: 12,
    fontWeight: '800',
  },
  zoomCard: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#E9DFCF',
  },
  zoomHeader: {
    marginBottom: 12,
  },
  zoomTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D261E',
  },
  zoomSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#7D7366',
    fontWeight: '600',
  },
  zoomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  zoomButton: {
    width: '31.5%',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FBF6EA',
    borderWidth: 1,
    borderColor: '#E8D8BC',
  },
  zoomButtonActive: {
    backgroundColor: '#D29A52',
    borderColor: '#D29A52',
  },
  zoomButtonText: {
    color: '#614B23',
    fontSize: 12,
    fontWeight: '800',
  },
  zoomButtonTextActive: {
    color: '#FFFFFF',
  },
  timelineRow: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'flex-start',
  },
  timelineScore: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineScoreText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#FBF6EA',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8D8BC',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timelineEventLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#2E281E',
    paddingRight: 12,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#857865',
  },
  timelineEventText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#53493D',
  },
  spacer: {
    height: 20,
  },
});

export default TrendsScreen;
