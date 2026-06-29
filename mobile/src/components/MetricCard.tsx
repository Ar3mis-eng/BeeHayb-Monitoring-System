import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStressColor, getStressIcon, formatMetricValue } from '../utils/helpers';
import { BeeStressLevel } from '../types';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  trend: number;
  status: BeeStressLevel;
  icon?: string;
  trendUnit?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  status,
  icon,
  trendUnit = '/hr',
}) => {
  const statusColor = getStressColor(status);
  const trendSign = trend >= 0 ? '+' : '';

  return (
    <View style={[styles.card, { borderLeftColor: statusColor }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <Text style={styles.icon}>{icon}</Text>}
      </View>

      <View style={styles.content}>
        <Text style={styles.value}>
          {formatMetricValue(value, 1)}
          <Text style={styles.unit}>{unit}</Text>
        </Text>
        <Text style={[styles.trend, { color: trend >= 0 ? '#D9A25F' : '#6BA36F' }]}>
          {trendSign}
          {formatMetricValue(Math.abs(trend), 1)}{trendUnit}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E2E2E',
  },
  icon: {
    fontSize: 20,
  },
  content: {
    marginBottom: 12,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2E2E2E',
  },
  unit: {
    fontSize: 16,
    fontWeight: '400',
    color: '#888',
    marginLeft: 4,
  },
  trend: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MetricCard;
