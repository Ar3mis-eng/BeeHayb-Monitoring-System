import AsyncStorage from '@react-native-async-storage/async-storage';
import { BeeStressLevel, SensorReading } from '../types';
import { formatMetricValue } from './helpers';

const ANALYTICS_BASELINE_KEY = 'beehaybAnalyticsBaselines';
const ROUTINE_EVENT_BUCKET_MS = 30 * 60 * 1000;
const URGENT_EVENT_BUCKET_MS = 5 * 60 * 1000;

export interface MetricTrendContext {
  current: number;
  recentAverage: number;
  baselineAverage: number;
  dayAverage: number;
  nightAverage: number;
  deltaFromBaseline: number;
  recentChange: number;
  volatility: number;
  direction: 'rising' | 'falling' | 'stable';
  sampleCount: number;
}

export interface AnalyticsEvent {
  label: string;
  severity: BeeStressLevel;
  message: string;
  score: number;
}

export interface AnalyticsTimelineEvent extends AnalyticsEvent {
  detectedAt: Date;
}

export interface PersistedMetricBaseline {
  baselineAverage: number;
  dayAverage: number;
  nightAverage: number;
  sampleCount: number;
}

export interface PersistedHiveBaseline {
  hiveId: number;
  updatedAt: string;
  temperature: PersistedMetricBaseline;
  humidity: PersistedMetricBaseline;
  soundLevel: PersistedMetricBaseline;
}

export interface MetricInsight {
  title: string;
  current: string;
  summary: string;
  interpretation: string;
  beeImpact: string;
  action: string;
  eventLabels: string[];
}

export interface HiveAnalyticsSnapshot {
  temperatureTrend: MetricTrendContext;
  humidityTrend: MetricTrendContext;
  soundTrend: MetricTrendContext;
  stressIndex: number;
  stressStatus: BeeStressLevel;
  unstableMetricCount: number;
  events: AnalyticsEvent[];
}

const TREND_WINDOW = 5;

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getStressIndex = (status: BeeStressLevel, soundLevel: number): number => {
  const baseScore = status === 'Critical' ? 90 : status === 'Warning' ? 67 : 38;
  return Math.min(100, Math.max(0, Math.round(baseScore + (soundLevel - 55) * 0.45)));
};

export const describeDirection = (direction: MetricTrendContext['direction']): string => {
  if (direction === 'rising') {
    return 'rising';
  }

  if (direction === 'falling') {
    return 'falling';
  }

  return 'holding steady';
};

export const buildTrendContext = (
  readings: SensorReading[],
  selector: (reading: SensorReading) => number,
  directionThreshold: number,
  persistedBaseline?: PersistedMetricBaseline
): MetricTrendContext => {
  const orderedReadings = [...readings].sort(
    (left, right) => new Date(left.recorded_at).getTime() - new Date(right.recorded_at).getTime()
  );
  const values = orderedReadings
    .map(selector)
    .filter((value) => Number.isFinite(value));

  const current = values[values.length - 1] ?? 0;
  const recentValues = values.slice(-TREND_WINDOW);
  const baselineValues = values.slice(0, Math.max(values.length - TREND_WINDOW, 1));
  const recentAverage = average(recentValues);
  const computedBaselineAverage = average(baselineValues.length > 0 ? baselineValues : recentValues);
  const baselineAverage = values.length >= 12
    ? computedBaselineAverage
    : persistedBaseline?.baselineAverage ?? computedBaselineAverage;
  const previousValue = values.length > 1 ? values[values.length - 2] : current;
  const recentChange = current - previousValue;
  const deltaFromBaseline = current - baselineAverage;
  const volatility = recentValues.length > 0 ? Math.max(...recentValues) - Math.min(...recentValues) : 0;

  const dayValues = orderedReadings
    .filter((reading) => {
      const hour = new Date(reading.recorded_at).getHours();
      return hour >= 6 && hour < 18;
    })
    .map(selector)
    .filter((value) => Number.isFinite(value));
  const nightValues = orderedReadings
    .filter((reading) => {
      const hour = new Date(reading.recorded_at).getHours();
      return hour < 6 || hour >= 18;
    })
    .map(selector)
    .filter((value) => Number.isFinite(value));

  let direction: MetricTrendContext['direction'] = 'stable';
  if (recentChange > directionThreshold) {
    direction = 'rising';
  } else if (recentChange < -directionThreshold) {
    direction = 'falling';
  }

  return {
    current,
    recentAverage,
    baselineAverage,
    dayAverage: dayValues.length >= 3 ? average(dayValues) : persistedBaseline?.dayAverage ?? average(dayValues),
    nightAverage: nightValues.length >= 3 ? average(nightValues) : persistedBaseline?.nightAverage ?? average(nightValues),
    deltaFromBaseline,
    recentChange,
    volatility,
    direction,
    sampleCount: Math.max(values.length, persistedBaseline?.sampleCount ?? 0),
  };
};

const createEvent = (label: string, severity: BeeStressLevel, message: string, score: number): AnalyticsEvent => ({
  label,
  severity,
  message,
  score,
});

const shouldReportImmediately = (event: AnalyticsEvent): boolean => event.severity === 'Critical' || event.score >= 80;

const deriveEvents = (
  temperatureTrend: MetricTrendContext,
  humidityTrend: MetricTrendContext,
  soundTrend: MetricTrendContext,
  stressStatus: BeeStressLevel,
  hasLatestReading: boolean
): AnalyticsEvent[] => {
  const events: AnalyticsEvent[] = [];

  if (!hasLatestReading) {
    events.push(
      createEvent(
        'No Live Telemetry',
        'Critical',
        'No recent telemetry is available, so behavioral analysis is limited until new readings arrive.',
        92
      )
    );
    return events;
  }

  if (temperatureTrend.current >= 35 && soundTrend.direction === 'rising') {
    events.push(
      createEvent(
        'Overheating Risk',
        'Critical',
        'Temperature is elevated while acoustic activity is also climbing, which often signals heat-management strain.',
        88
      )
    );
  }

  if (humidityTrend.current >= 75 || humidityTrend.volatility >= 10 || Math.abs(humidityTrend.deltaFromBaseline) >= 8) {
    events.push(
      createEvent(
        'Moisture Instability',
        humidityTrend.current >= 75 ? 'Warning' : 'Healthy',
        'Humidity is either elevated or swinging sharply relative to baseline, increasing the chance of internal moisture imbalance.',
        humidityTrend.current >= 75 ? 68 : 44
      )
    );
  }

  if (soundTrend.current >= 68 && soundTrend.direction === 'rising' && stressStatus !== 'Healthy') {
    events.push(
      createEvent(
        'Agitation Episode',
        stressStatus,
        'Sound is trending upward while stress indicators are elevated, suggesting the colony is becoming more reactive.',
        stressStatus === 'Critical' ? 84 : 64
      )
    );
  }

  if (temperatureTrend.current <= 30 && temperatureTrend.direction === 'falling') {
    events.push(
      createEvent(
        'Brood Chill Risk',
        'Warning',
        'Temperature is trending downward below the preferred brood-management range.',
        62
      )
    );
  }

  if (events.length === 0) {
    events.push(
      createEvent(
        'Colony Stable',
        'Healthy',
        'Recent readings are close to their rolling baseline with no major correlated warning patterns.',
        18
      )
    );
  }

  return events;
};

export const buildHiveAnalytics = (
  readings: SensorReading[],
  persistedBaseline?: PersistedHiveBaseline
): HiveAnalyticsSnapshot => {
  const orderedReadings = [...readings].sort(
    (left, right) => new Date(left.recorded_at).getTime() - new Date(right.recorded_at).getTime()
  );
  const latestReading = orderedReadings[orderedReadings.length - 1];
  const temperatureTrend = buildTrendContext(orderedReadings, (reading) => Number(reading.temperature) || 0, 0.4, persistedBaseline?.temperature);
  const humidityTrend = buildTrendContext(orderedReadings, (reading) => Number(reading.humidity) || 0, 1.5, persistedBaseline?.humidity);
  const soundTrend = buildTrendContext(orderedReadings, (reading) => Number(reading.sound_level) || 0, 1, persistedBaseline?.soundLevel);
  const stressStatus = latestReading?.bee_stress_status ?? 'Critical';
  const stressIndex = getStressIndex(stressStatus, soundTrend.current);
  const events = deriveEvents(temperatureTrend, humidityTrend, soundTrend, stressStatus, Boolean(latestReading));

  const unstableMetricCount = [
    Math.abs(temperatureTrend.deltaFromBaseline) >= 1,
    Math.abs(humidityTrend.deltaFromBaseline) >= 5,
    Math.abs(soundTrend.deltaFromBaseline) >= 4,
  ].filter(Boolean).length;

  return {
    temperatureTrend,
    humidityTrend,
    soundTrend,
    stressIndex,
    stressStatus,
    unstableMetricCount,
    events,
  };
};

export const buildPersistedHiveBaseline = (hiveId: number, readings: SensorReading[]): PersistedHiveBaseline => {
  const snapshot = buildHiveAnalytics(readings);
  return {
    hiveId,
    updatedAt: new Date().toISOString(),
    temperature: {
      baselineAverage: snapshot.temperatureTrend.baselineAverage,
      dayAverage: snapshot.temperatureTrend.dayAverage,
      nightAverage: snapshot.temperatureTrend.nightAverage,
      sampleCount: snapshot.temperatureTrend.sampleCount,
    },
    humidity: {
      baselineAverage: snapshot.humidityTrend.baselineAverage,
      dayAverage: snapshot.humidityTrend.dayAverage,
      nightAverage: snapshot.humidityTrend.nightAverage,
      sampleCount: snapshot.humidityTrend.sampleCount,
    },
    soundLevel: {
      baselineAverage: snapshot.soundTrend.baselineAverage,
      dayAverage: snapshot.soundTrend.dayAverage,
      nightAverage: snapshot.soundTrend.nightAverage,
      sampleCount: snapshot.soundTrend.sampleCount,
    },
  };
};

export const loadPersistedHiveBaseline = async (hiveId: number): Promise<PersistedHiveBaseline | null> => {
  const raw = await AsyncStorage.getItem(ANALYTICS_BASELINE_KEY);
  if (!raw) {
    return null;
  }

  const baselines = JSON.parse(raw) as Record<string, PersistedHiveBaseline>;
  return baselines[String(hiveId)] ?? null;
};

export const savePersistedHiveBaseline = async (baseline: PersistedHiveBaseline): Promise<void> => {
  const raw = await AsyncStorage.getItem(ANALYTICS_BASELINE_KEY);
  const baselines = raw ? (JSON.parse(raw) as Record<string, PersistedHiveBaseline>) : {};
  baselines[String(baseline.hiveId)] = baseline;
  await AsyncStorage.setItem(ANALYTICS_BASELINE_KEY, JSON.stringify(baselines));
};

export const buildEventTimeline = (
  hiveId: number,
  readings: SensorReading[],
  persistedBaseline?: PersistedHiveBaseline,
  limit: number = 6
): AnalyticsTimelineEvent[] => {
  const hiveReadings = readings
    .filter((reading) => reading.hive_id === hiveId)
    .sort((left, right) => new Date(left.recorded_at).getTime() - new Date(right.recorded_at).getTime());

  const timeline: AnalyticsTimelineEvent[] = [];
  for (let index = Math.max(0, hiveReadings.length - 24); index < hiveReadings.length; index += 1) {
    const windowStart = Math.max(0, index - 7);
    const windowReadings = hiveReadings.slice(windowStart, index + 1);
    if (windowReadings.length < 3) {
      continue;
    }

    const snapshot = buildHiveAnalytics(windowReadings, persistedBaseline);
    const significantEvents = snapshot.events.filter((event) => event.label !== 'Colony Stable');
    significantEvents.forEach((event) => {
      timeline.push({
        ...event,
        detectedAt: new Date(windowReadings[windowReadings.length - 1].recorded_at),
      });
    });
  }

  const deduped = timeline.filter((event, index, allEvents) => {
    const previous = allEvents[index - 1];
    return !previous || previous.label !== event.label || previous.detectedAt.getTime() !== event.detectedAt.getTime();
  });

  const bucketedEvents = new Map<string, AnalyticsTimelineEvent>();
  deduped.forEach((event) => {
    const bucketSizeMs = shouldReportImmediately(event) ? URGENT_EVENT_BUCKET_MS : ROUTINE_EVENT_BUCKET_MS;
    const bucketStart = Math.floor(event.detectedAt.getTime() / bucketSizeMs) * bucketSizeMs;
    const bucketKey = `${event.label}-${bucketStart}`;
    const existingEvent = bucketedEvents.get(bucketKey);

    if (!existingEvent || event.score > existingEvent.score) {
      bucketedEvents.set(bucketKey, {
        ...event,
        detectedAt: shouldReportImmediately(event) ? event.detectedAt : new Date(bucketStart),
      });
    }
  });

  return Array.from(bucketedEvents.values())
    .sort((left, right) => right.detectedAt.getTime() - left.detectedAt.getTime())
    .slice(0, limit);
};

const getDayNightNarrative = (trend: MetricTrendContext, unit: string): string => {
  if (trend.dayAverage === 0 && trend.nightAverage === 0) {
    return 'There is not enough history yet to separate day and night behavior.';
  }

  const diff = trend.dayAverage - trend.nightAverage;
  if (Math.abs(diff) < 0.5) {
    return `Day and night averages are currently close, indicating a consistent ${unit} pattern across the hive cycle.`;
  }

  if (diff > 0) {
    return `Daytime averages are ${formatMetricValue(Math.abs(diff), 1)} ${unit} higher than nighttime averages.`;
  }

  return `Nighttime averages are ${formatMetricValue(Math.abs(diff), 1)} ${unit} higher than daytime averages.`;
};

export const buildMetricInsights = (snapshot: HiveAnalyticsSnapshot): Record<'temperature' | 'humidity' | 'soundLevel' | 'stressIndex', MetricInsight> => {
  const temperatureEvents = snapshot.events.filter((event) => event.label === 'Overheating Risk' || event.label === 'Brood Chill Risk');
  const humidityEvents = snapshot.events.filter((event) => event.label === 'Moisture Instability');
  const soundEvents = snapshot.events.filter((event) => event.label === 'Agitation Episode');

  return {
    temperature: {
      title: 'Temperature',
      current: `${formatMetricValue(snapshot.temperatureTrend.current, 1)} °C`,
      summary: `Temperature is ${describeDirection(snapshot.temperatureTrend.direction)} versus baseline and currently differs by ${formatMetricValue(Math.abs(snapshot.temperatureTrend.deltaFromBaseline), 1)} °C.`,
      interpretation: `${getDayNightNarrative(snapshot.temperatureTrend, '°C')} This reading is being compared to the hive's own rolling baseline, not just a fixed threshold.`,
      beeImpact: temperatureEvents.length > 0
        ? temperatureEvents[0].message
        : 'Thermal conditions are close to the recent hive pattern, which lowers the chance of brood stress from sudden heat imbalance.',
      action: temperatureEvents.length > 0
        ? 'Inspect ventilation, sun exposure, and whether rising sound levels confirm thermal strain.'
        : 'Continue watching for a linked rise in sound or a persistent shift away from the baseline.',
      eventLabels: temperatureEvents.map((event) => event.label),
    },
    humidity: {
      title: 'Humidity',
      current: `${formatMetricValue(snapshot.humidityTrend.current, 1)} %`,
      summary: `Humidity is ${describeDirection(snapshot.humidityTrend.direction)} with a short-term volatility of ${formatMetricValue(snapshot.humidityTrend.volatility, 1)}%.`,
      interpretation: `${getDayNightNarrative(snapshot.humidityTrend, '%')} The interpretation now favors rolling balance and volatility rather than a single raw reading.`,
      beeImpact: humidityEvents.length > 0
        ? humidityEvents[0].message
        : 'Moisture behavior looks stable enough to avoid obvious condensation or drying stress patterns right now.',
      action: humidityEvents.length > 0
        ? 'Inspect airflow and moisture retention, especially if temperature is also drifting upward.'
        : 'Track whether humidity starts widening between day and night or drifting sharply from its baseline.',
      eventLabels: humidityEvents.map((event) => event.label),
    },
    soundLevel: {
      title: 'Sound Level',
      current: `${formatMetricValue(snapshot.soundTrend.current, 1)} dB`,
      summary: `Sound is ${describeDirection(snapshot.soundTrend.direction)} and differs from baseline by ${formatMetricValue(Math.abs(snapshot.soundTrend.deltaFromBaseline), 1)} dB.`,
      interpretation: `${getDayNightNarrative(snapshot.soundTrend, 'dB')} Sudden upward movement matters more than volume alone when evaluating colony agitation.`,
      beeImpact: soundEvents.length > 0
        ? soundEvents[0].message
        : 'Acoustic activity is not currently showing a strong correlated stress signal.',
      action: soundEvents.length > 0
        ? 'Inspect for disturbance, overheating, congestion, or defensive behavior around the hive.'
        : 'Use sound together with temperature and stress drift to judge whether a change is meaningful.',
      eventLabels: soundEvents.map((event) => event.label),
    },
    stressIndex: {
      title: 'Stress Index',
      current: `${snapshot.stressIndex}/100`,
      summary: `Stress combines the current colony state with ${snapshot.unstableMetricCount} metric deviations from rolling baseline.`,
      interpretation: 'This score now reflects cross-metric drift, not only the current stress label, so it reacts when multiple signals move together.',
      beeImpact: snapshot.events[0]?.message ?? 'The colony appears stable against its recent telemetry pattern.',
      action: snapshot.stressStatus === 'Critical'
        ? 'Investigate the triggered event labels first, then verify which metrics are drifting together.'
        : 'Watch whether the same event labels persist across consecutive readings before treating the shift as a real colony event.',
      eventLabels: snapshot.events.map((event) => event.label),
    },
  };
};