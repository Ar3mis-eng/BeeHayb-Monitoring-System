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
      <View style={styles.leftWrap}>
        <Text style={styles.leftText}>Live • Last sync: {formatDate(lastSyncTime)}</Text>
      </View>
      <View style={styles.rightWrap}>
        <Text style={styles.rightText}>{getSourceLabel(sensorSource)}</Text>
      </View>
    </View>
  );
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
  rightText: {
    fontSize: 13,
    color: '#6F675A',
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default LiveStatusCard;
