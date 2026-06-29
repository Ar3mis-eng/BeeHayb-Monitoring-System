import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ConnectionBadge from './ConnectionBadge';

interface HeaderProps {
  hiveName: string;
  connectionStatus: 'Connected' | 'Disconnected';
  sensorSource: 'Mock' | 'WiFi' | 'MQTT' | 'Bluetooth';
}

const Header: React.FC<HeaderProps> = ({ hiveName, connectionStatus, sensorSource }) => {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.appName}>Bee-Hayb</Text>
        <Text style={styles.hiveName}>{hiveName}</Text>
      </View>
      <ConnectionBadge status={connectionStatus} sensorSource={sensorSource} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#F8F5F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3DB',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D9A25F',
  },
  hiveName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E2E2E',
    marginTop: 2,
  },
});

export default Header;
