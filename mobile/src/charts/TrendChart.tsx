import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { ChartDataPoint } from '../types';

interface TrendChartProps {
  title: string;
  data: ChartDataPoint[];
  color: string;
  unit: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ title, data, color, unit }) => {
  const windowWidth = Dimensions.get('window').width;

  // Process data for Victory
  const chartData = data.map((point, index) => ({
    x: index,
    y: point.value,
    label: point.timestamp,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <VictoryChart
        width={windowWidth - 24}
        height={250}
        theme={VictoryTheme.material}
        padding={{ top: 10, bottom: 30, left: 50, right: 10 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: '#e0e0e0' },
            ticks: { stroke: '#c0c0c0' },
            tickLabels: { fontSize: 10, fill: '#888' },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: '#e0e0e0' },
            ticks: { stroke: '#c0c0c0' },
            tickLabels: { fontSize: 10, fill: '#888' },
          }}
        />
        <VictoryLine
          data={chartData}
          style={{
            data: {
              stroke: color,
              strokeWidth: 2,
            },
          }}
          interpolation="catmullRom"
        />
      </VictoryChart>

      <Text style={styles.unit}>Unit: {unit}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 12,
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
  unit: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});

export default TrendChart;
