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
      <View style={styles.leftWrap}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>BH</Text>
        </View>
        <View>
          <Text style={styles.appName}>Bee-Hayb</Text>
          <Text style={styles.hiveName}>{hiveName}</Text>
        </View>
      </View>
      <ConnectionBadge status={connectionStatus} sensorSource={sensorSource} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'rgba(248, 245, 240, 0.74)',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3DB',
  },
  leftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF8EE',
    borderWidth: 1,
    borderColor: '#D9A25F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#D9A25F',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.4,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#231F18',
  },
  hiveName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5E5A52',
    marginTop: 2,
  },
});

export default Header;
