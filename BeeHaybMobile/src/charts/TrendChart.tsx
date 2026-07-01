import React from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line as SvgLine,
  LinearGradient,
  Path,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { ChartDataPoint } from '../types';
import { formatMetricValue, formatTime } from '../utils/helpers';
import { AnalyticsTimelineEvent } from '../utils/analytics';
import { getStressColor } from '../utils/helpers';

interface TrendChartProps {
  title: string;
  data: ChartDataPoint[];
  color: string;
  unit: string;
  decimals?: number;
  events?: AnalyticsTimelineEvent[];
  zoomLevel?: number;
}

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  color,
  unit,
  decimals = 1,
  events = [],
  zoomLevel = 1.35,
}) => {
  const windowWidth = Dimensions.get('window').width;
  const viewportWidth = windowWidth - 56;
  const chartHeight = 250;
  const padding = { top: 22, right: 18, bottom: 40, left: 18 };

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
  const pointSpacing = 34 * zoomLevel;
  const chartWidth = Math.max(
    viewportWidth,
    padding.left + padding.right + Math.max(chartPoints.length - 1, 1) * pointSpacing
  );
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const currentValue = values[values.length - 1] ?? 0;
  const averageValue = values.reduce((sum, value) => sum + value, 0) / values.length;

  const scaledPoints = chartPoints.map((point, index) => {
    const x = padding.left + (chartPoints.length <= 1 ? innerWidth / 2 : (index / (chartPoints.length - 1)) * innerWidth);
    const y = padding.top + (1 - (point.y - minValue) / valueRange) * innerHeight;
    return { ...point, x, y };
  });

  const polylinePoints = scaledPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPath = scaledPoints.length
    ? `${scaledPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ')} L ${scaledPoints[scaledPoints.length - 1].x} ${padding.top + innerHeight} L ${scaledPoints[0].x} ${padding.top + innerHeight} Z`
    : '';
  const tickValues = [maxValue, minValue + valueRange / 2, minValue];
  const xLabelIndexes = Array.from(new Set([0, Math.max(0, Math.floor((scaledPoints.length - 1) / 2)), Math.max(0, scaledPoints.length - 1)]));

  const formatTick = (value: number) => Number(value).toFixed(decimals);
  const gradientId = `chartGradient${title.replace(/\s+/g, '')}`;
  const glowId = `chartGlow${title.replace(/\s+/g, '')}`;
  const plottedEvents = events
    .slice(0, 4)
    .map((event) => {
      const nearestPoint = scaledPoints.reduce<{ distance: number; point: typeof scaledPoints[number] | null }>(
        (best, point) => {
          const distance = Math.abs(new Date(point.label).getTime() - new Date(event.detectedAt).getTime());
          if (distance < best.distance) {
            return { distance, point };
          }
          return best;
        },
        { distance: Number.POSITIVE_INFINITY, point: null }
      ).point;

      return nearestPoint ? { event, point: nearestPoint } : null;
    })
    .filter((value): value is { event: AnalyticsTimelineEvent; point: typeof scaledPoints[number] } => Boolean(value));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Live synchronized telemetry</Text>
        </View>
        <View style={styles.currentPill}>
          <View style={[styles.currentDot, { backgroundColor: color }]} />
          <Text style={styles.currentPillText}>{formatMetricValue(currentValue, decimals)} {unit}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={styles.statValue}>{formatMetricValue(currentValue, decimals)}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>{formatMetricValue(averageValue, decimals)}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Peak</Text>
          <Text style={styles.statValue}>{formatMetricValue(maxValue, decimals)}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContent}
      >
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </LinearGradient>
            <LinearGradient id={glowId} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={color} stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <Rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={innerHeight}
            rx={20}
            fill={`url(#${glowId})`}
          />

          {[0, 1, 2, 3].map((index) => {
            const y = padding.top + (innerHeight / 3) * index;
            return (
              <SvgLine
                key={`grid-${index}`}
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#EFE7D9"
                strokeWidth={1}
                strokeDasharray="4 7"
              />
            );
          })}

          {areaPath ? <Path d={areaPath} fill={`url(#${gradientId})`} /> : null}

          {polylinePoints ? (
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke={color}
              strokeWidth={4}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {scaledPoints.map((point, index) => {
            const isLast = index === scaledPoints.length - 1;
            return (
              <React.Fragment key={`${point.x}-${point.y}-${index}`}>
                <Circle cx={point.x} cy={point.y} r={isLast ? 5.5 : 3.5} fill="#FFFDF8" stroke={color} strokeWidth={isLast ? 3 : 2} />
                {isLast ? <Circle cx={point.x} cy={point.y} r={9} fill={color} opacity={0.12} /> : null}
              </React.Fragment>
            );
          })}

          {plottedEvents.map(({ event, point }) => {
            const markerColor = getStressColor(event.severity);
            return (
              <React.Fragment key={`${event.label}-${event.detectedAt.toISOString()}`}>
                <SvgLine
                  x1={point.x}
                  y1={padding.top}
                  x2={point.x}
                  y2={padding.top + innerHeight}
                  stroke={markerColor}
                  strokeOpacity={0.22}
                  strokeWidth={2}
                  strokeDasharray="5 6"
                />
                <Circle cx={point.x} cy={point.y} r={8} fill="#FFFDF8" stroke={markerColor} strokeWidth={3} />
                <Rect
                  x={Math.max(padding.left, Math.min(point.x - 44, chartWidth - padding.right - 88))}
                  y={Math.max(6, point.y - 42)}
                  width={88}
                  height={24}
                  rx={12}
                  fill={markerColor}
                />
                <SvgText
                  x={Math.max(padding.left + 44, Math.min(point.x, chartWidth - padding.right - 44))}
                  y={Math.max(22, point.y - 26)}
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="800"
                  textAnchor="middle"
                >
                  {event.label.length > 12 ? `${event.label.slice(0, 12)}...` : event.label}
                </SvgText>
              </React.Fragment>
            );
          })}

          {tickValues.map((tickValue, index) => {
            const y = padding.top + (index === 0 ? 0 : index === 1 ? innerHeight / 2 : innerHeight);
            return (
              <SvgText
                key={`tick-${index}`}
                x={padding.left + 8}
                y={y - 8}
                fill="#8A8072"
                fontSize="11"
                fontWeight="700"
              >
                {formatTick(tickValue)}
              </SvgText>
            );
          })}

          {xLabelIndexes.map((index) => {
            const point = scaledPoints[index];
            if (!point) {
              return null;
            }

            return (
              <SvgText
                key={`xlabel-${index}`}
                x={point.x}
                y={chartHeight - 10}
                fill="#8A8072"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
              >
                {formatTime(point.label).replace(/:\d{2}\s/, ' ')}
              </SvgText>
            );
          })}
        </Svg>
      </ScrollView>

      <Text style={styles.unit}>Unit: {unit}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 12,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#EADFCD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E2E2E',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#857B6D',
    fontWeight: '600',
  },
  currentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F1E7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8DCC7',
  },
  currentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  currentPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#493F33',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chartScrollContent: {
    paddingBottom: 4,
  },
  statChip: {
    width: '31.5%',
    backgroundColor: '#FCF7EF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EDE2D1',
  },
  statLabel: {
    fontSize: 11,
    color: '#8D826F',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 6,
    fontSize: 18,
    color: '#272118',
    fontWeight: '800',
  },
  unit: {
    fontSize: 12,
    color: '#7E7568',
    marginTop: 8,
    fontWeight: '700',
  },
});

export default TrendChart;
