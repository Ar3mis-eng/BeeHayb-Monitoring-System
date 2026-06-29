import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDate } from '../utils/helpers';

interface LiveStatusCardProps {
  lastSyncTime: Date;
  sensorSource: 'Mock' | 'WiFi' | 'MQTT' | 'Bluetooth';
}

const LiveStatusCard: React.FC<LiveStatusCardProps> = ({ lastSyncTime, sensorSource }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Live Status</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Last Sync:</Text>
        <Text style={styles.value}>{formatDate(lastSyncTime)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Sensor Source:</Text>
        <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(sensorSource) }]}>
          <Text style={styles.sourceText}>{sensorSource}</Text>
        </View>
      </View>
    </View>
  );
};

const getSourceColor = (source: string): string => {
  switch (source) {
    case 'WiFi':
      return '#4CAF50';
    case 'MQTT':
      return '#2196F3';
    case 'Bluetooth':
      return '#9C27B0';
    case 'Mock':
    default:
      return '#FF9800';
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2E2E',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  value: {
    fontSize: 13,
    fontWeight: '400',
    color: '#2E2E2E',
  },
  sourceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LiveStatusCard;
