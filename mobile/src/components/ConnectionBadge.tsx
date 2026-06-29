import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConnectionBadgeProps {
  status: 'Connected' | 'Disconnected';
  sensorSource: 'Mock' | 'WiFi' | 'MQTT' | 'Bluetooth';
}

const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ status, sensorSource }) => {
  const isConnected = status === 'Connected';
  const statusColor = isConnected ? '#6BA36F' : '#D9534F';

  return (
    <View style={[styles.badge, { backgroundColor: statusColor }]}>
      <View style={[styles.indicator, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
      <Text style={styles.text}>
        {status} • {sensorSource}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ConnectionBadge;
