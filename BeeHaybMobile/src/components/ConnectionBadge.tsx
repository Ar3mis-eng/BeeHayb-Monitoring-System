import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConnectionBadgeProps {
  status: 'Connected' | 'Disconnected';
  sensorSource: 'Mock' | 'WiFi' | 'MQTT' | 'Bluetooth';
}

const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ status }) => {
  const isConnected = status === 'Connected';
  const statusColor = isConnected ? '#6BA36F' : '#D9534F';

  return (
    <View style={[styles.badge, { borderColor: isConnected ? '#BFD9BF' : '#E6BABA' }]}>
      <View style={[styles.indicator, { backgroundColor: statusColor }]} />
      <Text style={[styles.text, { color: isConnected ? '#5E875E' : '#A15252' }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: '#F6F9F2',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ConnectionBadge;
