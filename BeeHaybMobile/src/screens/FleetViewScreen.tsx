import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { hiveService } from '../services/api';
import { useHiveStore, useSensorStore } from '../utils/store';
import { BeeStressLevel, Hive } from '../types';
import { formatMetricValue, getStressColor } from '../utils/helpers';
import { buildHiveAnalytics } from '../utils/analytics';

const UNABLE_TO_DETECT_OTHER_DEVICES = 'Unable to detect other devices';

interface HiveAnalytics {
  hiveId: number;
  hiveName: string;
  stress: BeeStressLevel;
  alerts: string[];
  hasReading: boolean;
}

interface HiveCardProps {
  hive: Hive;
  isSelected: boolean;
  onSelect: (hiveId: number) => void;
  temperature?: number;
  humidity?: number;
  soundLevel?: number;
  hasReading: boolean;
}

const HiveCard: React.FC<HiveCardProps> = ({
  hive,
  isSelected,
  onSelect,
  temperature,
  humidity,
  soundLevel,
  hasReading,
}) => {
  return (
    <TouchableOpacity
      style={[styles.hiveCard, isSelected && styles.selectedCard]}
      onPress={() => onSelect(hive.id)}
    >
      <Text style={styles.hiveName}>{hive.hive_name}</Text>
      <Text style={styles.location}>{hive.location}</Text>

      {hasReading ? (
        <View style={styles.metricsContainer}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Temp</Text>
            <Text style={styles.metricValue}>{formatMetricValue(temperature, 1)}°C</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Humidity</Text>
            <Text style={styles.metricValue}>{formatMetricValue(humidity, 1)}%</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Sound</Text>
            <Text style={styles.metricValue}>{formatMetricValue(soundLevel, 0)}dB</Text>
          </View>
        </View>
      ) : (
        <View style={styles.failedWrap}>
          <Text style={styles.failedText}>Failed to retrieve data</Text>
        </View>
      )}

      <Text style={styles.lastSeen}>Last seen: now</Text>
    </TouchableOpacity>
  );
};

const FleetViewScreen: React.FC = () => {
  const hives = useHiveStore((state) => state.hives);
  const selectedHiveId = useHiveStore((state) => state.selectedHiveId);
  const setHives = useHiveStore((state) => state.setHives);
  const setSelectedHiveId = useHiveStore((state) => state.setSelectedHiveId);
  const latestReadings = useSensorStore((state) => state.latestReadings);
  const [loading, setLoading] = React.useState(false);
  const visibleHives = hives;
  const hiveAnalytics: HiveAnalytics[] = visibleHives.map((hive) => {
    const reading = latestReadings.get(hive.id);
    const analytics = reading
      ? buildHiveAnalytics([reading])
      : {
          stressStatus: 'Critical' as const,
          events: [{ label: 'No Live Telemetry', severity: 'Critical' as const, message: 'No recent telemetry is available for this hive.' }],
        };
    return {
      hiveId: hive.id,
      hiveName: hive.hive_name,
      stress: analytics.stressStatus,
      alerts: analytics.events.map((event) => `${event.label}: ${event.message}`),
      hasReading: Boolean(reading),
    };
  });
  const warningCount = hiveAnalytics.filter((item) => item.hasReading && item.stress !== 'Healthy').length;
  const healthyCount = hiveAnalytics.filter((item) => item.hasReading && item.stress === 'Healthy').length;
  const missingCount = hiveAnalytics.filter((item) => !item.hasReading).length;
  const selectedAnalytics = hiveAnalytics.find((item) => item.hiveId === selectedHiveId) ?? hiveAnalytics[0];

  useEffect(() => {
    const fetchHives = async () => {
      try {
        setLoading(true);
        const allHives = await hiveService.getAllHives();
        setHives(allHives);
        if (allHives.length > 0 && !selectedHiveId) {
          setSelectedHiveId(allHives[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch hives:', error);
      } finally {
        setLoading(false);
      }
    };

    if (hives.length === 0) {
      fetchHives();
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Fleet View</Text>
          <Text style={styles.headerSubtitle}>All Hives</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D9A25F" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fleet View</Text>
        <Text style={styles.headerSubtitle}>
          {visibleHives.length} Hive{visibleHives.length === 1 ? '' : 's'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {visibleHives.length > 0 ? (
          <View style={styles.analyticsPanel}>
            <Text style={styles.analyticsTitle}>Fleet Analytics</Text>
            <Text style={styles.analyticsSubtitle}>Warning signs and current colony health overview</Text>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.summaryCardWarning]}>
                <Text style={styles.summaryValue}>{warningCount}</Text>
                <Text style={styles.summaryLabel}>At Risk</Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardHealthy]}>
                <Text style={styles.summaryValue}>{healthyCount}</Text>
                <Text style={styles.summaryLabel}>Stable</Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardMissing]}>
                <Text style={styles.summaryValue}>{missingCount}</Text>
                <Text style={styles.summaryLabel}>No Data</Text>
              </View>
            </View>

            {selectedAnalytics ? (
              <View style={styles.focusPanel}>
                <View style={styles.focusHeader}>
                  <Text style={styles.focusTitle}>{selectedAnalytics.hiveName}</Text>
                  <View
                    style={[
                      styles.focusBadge,
                      { backgroundColor: getStressColor(selectedAnalytics.stress) },
                    ]}
                  >
                    <Text style={styles.focusBadgeText}>{selectedAnalytics.stress}</Text>
                  </View>
                </View>

                {selectedAnalytics.alerts.map((alert) => (
                  <View key={alert} style={styles.alertRow}>
                    <View style={styles.alertDot} />
                    <Text style={styles.alertText}>{alert}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {visibleHives.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{UNABLE_TO_DETECT_OTHER_DEVICES}</Text>
          </View>
        ) : null}

        {visibleHives.map((hive) => {
          const latestReading = latestReadings.get(hive.id);
          return (
            <HiveCard
              key={hive.id}
              hive={hive}
              isSelected={selectedHiveId === hive.id}
              onSelect={setSelectedHiveId}
              temperature={Number(latestReading?.temperature)}
              humidity={Number(latestReading?.humidity)}
              soundLevel={Number(latestReading?.sound_level)}
              hasReading={Boolean(latestReading)}
            />
          );
        })}

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
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 251, 245, 0.8)',
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
  content: {
    padding: 12,
  },
  emptyState: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  hiveCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 18,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#E7D7BA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  selectedCard: {
    backgroundColor: '#FFF7EA',
    borderColor: '#D9A25F',
  },
  hiveName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E2E2E',
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E2E2E',
  },
  lastSeen: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  failedWrap: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E7D9CC',
    backgroundColor: '#FFF7F1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  failedText: {
    color: '#B35656',
    fontSize: 13,
    fontWeight: '600',
  },
  analyticsPanel: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7D7BA',
    padding: 18,
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A241B',
  },
  analyticsSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7B7265',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  summaryCard: {
    width: '31.5%',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  summaryCardWarning: {
    backgroundColor: '#FFF3E2',
    borderColor: '#E5B56A',
  },
  summaryCardHealthy: {
    backgroundColor: '#F1FAF1',
    borderColor: '#8CBD8D',
  },
  summaryCardMissing: {
    backgroundColor: '#FFF4F1',
    borderColor: '#E7B6AE',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#231E17',
    textAlign: 'center',
  },
  summaryLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#6E665A',
    textAlign: 'center',
  },
  focusPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7D7BA',
    backgroundColor: '#FBF6EA',
    padding: 16,
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B251C',
    flex: 1,
    paddingRight: 12,
  },
  focusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  focusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D29A52',
    marginTop: 7,
    marginRight: 10,
  },
  alertText: {
    flex: 1,
    color: '#4A4135',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    height: 20,
  },
});

export default FleetViewScreen;
