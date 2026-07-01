import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { getStressColor, formatMetricValue } from '../utils/helpers';
import { BeeStressLevel } from '../types';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  trend: number;
  status: BeeStressLevel;
  icon?: string;
  trendUnit?: string;
  decimals?: number;
  valueDisplay?: string;
  detailHint?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  status,
  icon,
  trendUnit = '/hr',
  decimals = 1,
  valueDisplay,
  detailHint = 'Tap for insights',
  onPress,
  style,
}) => {
  const statusColor = getStressColor(status);
  const trendSign = trend >= 0 ? '+' : '';
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: statusColor, shadowColor: statusColor },
        style,
        onPress && pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {valueDisplay ?? formatMetricValue(value, decimals)}
          <Text style={styles.unit}>{unit}</Text>
        </Text>
        <Text style={[styles.trend, { color: trend >= 0 ? '#D9A25F' : '#6BA36F' }]}>
          {trendSign}
          {formatMetricValue(Math.abs(trend), 1)}{trendUnit}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.detailHint}>{detailHint}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 18,
    minHeight: 190,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E2E2E',
    flexShrink: 1,
  },
  icon: {
    fontSize: 18,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1E1A14',
  },
  unit: {
    fontSize: 15,
    fontWeight: '700',
    color: '#716A60',
    marginLeft: 4,
  },
  trend: {
    fontSize: 15,
    marginTop: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B7C64',
  },
});

export default MetricCard;
