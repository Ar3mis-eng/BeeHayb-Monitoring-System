import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import Header from '../components/Header';
import { sensorService } from '../services/api';
import {
  AnalyticsTimelineEvent,
  buildEventTimeline,
  buildPersistedHiveBaseline,
  loadPersistedHiveBaseline,
  PersistedHiveBaseline,
  savePersistedHiveBaseline,
} from '../utils/analytics';
import { formatTime, getStressColor } from '../utils/helpers';

const HISTORY_REFRESH_MS = 5000;

type AnalyticsHistoryRouteParams = {
  AnalyticsHistory: {
    hiveId: number;
    hiveName: string;
  };
};

const AnalyticsHistoryScreen: React.FC = () => {
  const route = useRoute<RouteProp<AnalyticsHistoryRouteParams, 'AnalyticsHistory'>>();
  const { hiveId, hiveName } = route.params;
  const [events, setEvents] = useState<AnalyticsTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [persistedBaseline, setPersistedBaseline] = useState<PersistedHiveBaseline | null>(null);

  useEffect(() => {
    let active = true;

    const fetchHistory = async () => {
      try {
        const baseline = await loadPersistedHiveBaseline(hiveId);
        if (active) {
          setPersistedBaseline(baseline);
        }

        const readings = await sensorService.getSensorReadingsByHive(hiveId, 120);
        if (!active) {
          return;
        }

        const nextBaseline = buildPersistedHiveBaseline(hiveId, readings);
        setPersistedBaseline(nextBaseline);
        void savePersistedHiveBaseline(nextBaseline);
        setEvents(buildEventTimeline(hiveId, readings, baseline ?? nextBaseline, 20));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchHistory();
    const interval = setInterval(() => {
      void fetchHistory();
    }, HISTORY_REFRESH_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [hiveId]);

  return (
    <View style={styles.container}>
      <Header hiveName={hiveName} connectionStatus="Connected" sensorSource="MQTT" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Analytics History</Text>
        <Text style={styles.subtitle}>Persisted baseline-aware colony events with 30-minute grouping and immediate urgent alerts</Text>

        {persistedBaseline ? (
          <View style={styles.baselineCard}>
            <Text style={styles.baselineTitle}>Saved Baseline</Text>
            <Text style={styles.baselineText}>Temperature baseline: {persistedBaseline.temperature.baselineAverage.toFixed(1)} °C</Text>
            <Text style={styles.baselineText}>Humidity baseline: {persistedBaseline.humidity.baselineAverage.toFixed(1)} %</Text>
            <Text style={styles.baselineText}>Sound baseline: {persistedBaseline.soundLevel.baselineAverage.toFixed(1)} dB</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#D29A52" />
          </View>
        ) : null}

        {events.map((event) => (
          <View key={`${event.label}-${event.detectedAt.toISOString()}`} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <View style={[styles.severityDot, { backgroundColor: getStressColor(event.severity) }]} />
              <View style={styles.eventTitleWrap}>
                <Text style={styles.eventLabel}>{event.label}</Text>
                <Text style={styles.eventTime}>{formatTime(event.detectedAt)}</Text>
              </View>
              <View style={[styles.scorePill, { backgroundColor: getStressColor(event.severity) }]}>
                <Text style={styles.scoreText}>{event.score}</Text>
              </View>
            </View>
            <Text style={styles.eventMessage}>{event.message}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 14,
    paddingBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B251C',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7F7669',
    fontWeight: '600',
    marginBottom: 14,
  },
  baselineCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9DECC',
    padding: 16,
    marginBottom: 14,
  },
  baselineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#30291F',
    marginBottom: 8,
  },
  baselineText: {
    fontSize: 14,
    color: '#5B5144',
    marginTop: 4,
    fontWeight: '600',
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  eventCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E9DECC',
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  eventTitleWrap: {
    flex: 1,
  },
  eventLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2F281F',
  },
  eventTime: {
    marginTop: 3,
    fontSize: 12,
    color: '#867B6D',
    fontWeight: '700',
  },
  scorePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  eventMessage: {
    marginTop: 12,
    color: '#514738',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AnalyticsHistoryScreen;