import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { hiveService } from '../services/api';
import { useHiveStore, useSensorStore } from '../utils/store';
import { Hive } from '../types';
import { formatMetricValue } from '../utils/helpers';

const UNABLE_TO_DETECT_OTHER_DEVICES = 'Unable to detect other devices';
const PLACEHOLDER_HIVE_NAMES = new Set(['Hive Bravo', 'Hive Charlie']);

interface HiveCardProps {
  hive: Hive;
  isSelected: boolean;
  onSelect: (hiveId: number) => void;
  temperature?: number;
  humidity?: number;
  soundLevel?: number;
}

const HiveCard: React.FC<HiveCardProps> = ({
  hive,
  isSelected,
  onSelect,
  temperature,
  humidity,
  soundLevel,
}) => {
  return (
    <TouchableOpacity
      style={[styles.hiveCard, isSelected && styles.selectedCard]}
      onPress={() => onSelect(hive.id)}
    >
      <Text style={styles.hiveName}>{hive.hive_name}</Text>
      <Text style={styles.location}>{hive.location}</Text>

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
  const visibleHives = hives.filter((hive) => !PLACEHOLDER_HIVE_NAMES.has(hive.hive_name));

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
              temperature={Number(latestReading?.temperature) || 28}
              humidity={Number(latestReading?.humidity) || 60}
              soundLevel={Number(latestReading?.sound_level) || 55}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D9A25F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: '#FFF9F0',
    borderLeftColor: '#6BA36F',
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
