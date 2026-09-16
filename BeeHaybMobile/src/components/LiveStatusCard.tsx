import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDate } from '../utils/helpers';
import { BeeStressLevel, StressReason } from '../types';

interface LiveStatusCardProps {
  lastSyncTime: Date;
  sensorSource: 'Mock' | 'WiFi' | 'MQTT' | 'Bluetooth';
  backendStatus?: 'Connected' | 'Disconnected';
  deviceStatus?: 'Fresh' | 'Stale' | 'Offline';
  lastUpdateLabel?: string;
  stressStatus?: BeeStressLevel;
  stressReasons?: StressReason[];
}

const LiveStatusCard: React.FC<LiveStatusCardProps> = ({
  lastSyncTime,
  sensorSource,
  backendStatus = 'Connected',
  deviceStatus = 'Fresh',
  lastUpdateLabel,
  stressStatus = 'Healthy',
  stressReasons = [],
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.leftWrap}>
        <Text style={styles.leftText}>Live • Last sync: {formatDate(lastSyncTime)}</Text>
        <Text style={styles.detailText}>Backend: {backendStatus}</Text>
        <Text style={styles.detailText}>Device: {deviceStatus} • Last update: {lastUpdateLabel || formatDate(lastSyncTime)}</Text>
      </View>
      <View style={styles.rightWrap}>
        <Text style={styles.rightText}>{getSourceLabel(sensorSource)}</Text>
      </View>
      <View style={styles.reasonWrap}>
        <Text style={[styles.reasonTitle, { color: getStatusColor(stressStatus) }]}>
          {stressStatus === 'Healthy' ? 'Healthy / ideal conditions' : `${stressStatus} conditions explained`}
        </Text>
        {stressReasons.length > 0 ? stressReasons.map((reason) => (
          <View key={`${reason.metric}-${reason.message}`} style={styles.reasonRow}>
            <Text style={[styles.reasonMetric, { color: getStatusColor(reason.severity) }]}>
              {reason.metric} · {reason.severity}
            </Text>
            <Text style={styles.reasonText}>{reason.message}</Text>
          </View>
        )) : (
          <Text style={styles.reasonText}>No sensor explanation is available yet.</Text>
        )}
      </View>
    </View>
  );
};

const getStatusColor = (status: BeeStressLevel): string => {
  if (status === 'Critical') {
    return '#B8443D';
  }

  if (status === 'Warning') {
    return '#A66A20';
  }

  return '#4D7E52';
};

const getSourceLabel = (source: string): string => {
  switch (source) {
    case 'WiFi':
      return 'WiFi Sensor Stream';
    case 'MQTT':
      return 'MQTT Sensor Stream';
    case 'Bluetooth':
      return 'Bluetooth Sensor Stream';
    case 'Mock':
    default:
      return 'Mock Sensor Stream';
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FBF9F3',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E4DDCE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    columnGap: 12,
  },
  leftWrap: {
    flex: 1,
    minWidth: 0,
  },
  rightWrap: {
    maxWidth: '42%',
    alignItems: 'flex-end',
  },
  leftText: {
    fontSize: 15,
    color: '#2C271E',
    fontWeight: '700',
    flexShrink: 1,
  },
  detailText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6F675A',
    fontWeight: '600',
  },
  rightText: {
    fontSize: 13,
    color: '#6F675A',
    fontWeight: '600',
    textAlign: 'right',
  },
  reasonWrap: {
    width: '100%',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4DDCE',
  },
  reasonTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  reasonText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6F675A',
    fontWeight: '600',
  },
  reasonRow: {
    marginTop: 8,
  },
  reasonMetric: {
    fontSize: 12,
    fontWeight: '800',
  },
});

export default LiveStatusCard;
