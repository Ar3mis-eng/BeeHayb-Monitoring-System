import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { ChartDataPoint } from '../types';

interface TrendChartProps {
  title: string;
  data: ChartDataPoint[];
  color: string;
  unit: string;
  decimals?: number;
}

const TrendChart: React.FC<TrendChartProps> = ({ title, data, color, unit, decimals = 1 }) => {
  const windowWidth = Dimensions.get('window').width;
  const chartWidth = windowWidth - 56;
  const chartHeight = 220;
  const padding = { top: 20, right: 16, bottom: 32, left: 40 };

  const numericData = data.map((point) => Number(point.value)).filter((value) => Number.isFinite(value));
  const chartPoints = data.map((point, index) => ({
    x: index,
    y: Number(point.value),
    label: point.timestamp,
  }));

  const values = numericData.length > 0 ? numericData : [0];
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const scaledPoints = chartPoints.map((point, index) => {
    const x = padding.left + (chartPoints.length <= 1 ? innerWidth / 2 : (index / (chartPoints.length - 1)) * innerWidth);
    const y = padding.top + (1 - (point.y - minValue) / valueRange) * innerHeight;
    return { ...point, x, y };
  });

  const polylinePoints = scaledPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const tickValues = [maxValue, minValue + valueRange / 2, minValue];

  const formatTick = (value: number) => Number(value).toFixed(decimals);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <Svg width={chartWidth} height={chartHeight}>
        <SvgLine
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={chartWidth - padding.right}
          y2={padding.top + innerHeight}
          stroke="#E8E3DB"
          strokeWidth={1}
        />
        <SvgLine
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerHeight}
          stroke="#E8E3DB"
          strokeWidth={1}
        />

        {[0, 1, 2].map((index) => {
          const y = padding.top + (innerHeight / 2) * index;
          return (
            <SvgLine
              key={`grid-${index}`}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="#F0EADF"
              strokeWidth={1}
            />
          );
        })}

        {polylinePoints ? (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {scaledPoints.map((point, index) => (
          <Circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r={3.5} fill={color} />
        ))}

        {tickValues.map((tickValue, index) => {
          const y = padding.top + (index === 0 ? 0 : index === 1 ? innerHeight / 2 : innerHeight);
          return (
            <SvgText
              key={`tick-${index}`}
              x={6}
              y={y + 4}
              fill="#888"
              fontSize="10"
            >
              {formatTick(tickValue)}
            </SvgText>
          );
        })}
      </Svg>

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
