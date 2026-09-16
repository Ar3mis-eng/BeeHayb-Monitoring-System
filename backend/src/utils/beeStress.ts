export type BeeStressLevel = 'Healthy' | 'Warning' | 'Critical';

export interface StressReason {
  metric: 'Sound' | 'Temperature' | 'Humidity';
  severity: BeeStressLevel;
  message: string;
}

const STRESS_RANK: Record<BeeStressLevel, number> = {
  Healthy: 0,
  Warning: 1,
  Critical: 2,
};

const maxStress = (...levels: BeeStressLevel[]): BeeStressLevel => {
  let highest: BeeStressLevel = 'Healthy';

  for (const level of levels) {
    if (STRESS_RANK[level] > STRESS_RANK[highest]) {
      highest = level;
    }
  }

  return highest;
};

const toFiniteNumber = (value: number | string | undefined): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const calculateSoundStress = (soundLevel: number | string | undefined): BeeStressLevel => {
  const normalizedSoundLevel = toFiniteNumber(soundLevel);

  if (normalizedSoundLevel === undefined) {
    return 'Healthy';
  }

  if (normalizedSoundLevel >= 76) {
    return 'Critical';
  }

  if (normalizedSoundLevel >= 61) {
    return 'Warning';
  }

  return 'Healthy';
};

const calculateTemperatureStress = (temperature?: number | string): BeeStressLevel => {
  const normalizedTemperature = toFiniteNumber(temperature);

  if (normalizedTemperature === undefined) {
    return 'Healthy';
  }

  if (normalizedTemperature < 10 || normalizedTemperature > 40) {
    return 'Critical';
  }

  if (normalizedTemperature < 30 || normalizedTemperature > 36.5) {
    return 'Warning';
  }

  return 'Healthy';
};

const calculateHumidityStress = (humidity?: number | string): BeeStressLevel => {
  const normalizedHumidity = toFiniteNumber(humidity);

  if (normalizedHumidity === undefined) {
    return 'Healthy';
  }

  if (normalizedHumidity < 10 || normalizedHumidity > 90) {
    return 'Critical';
  }

  if (normalizedHumidity < 40 || normalizedHumidity > 70) {
    return 'Warning';
  }

  return 'Healthy';
};

export const calculateStressReasons = (
  soundLevel: number | string | undefined,
  temperature?: number | string,
  humidity?: number | string
): StressReason[] => {
  const reasons: StressReason[] = [];
  const normalizedSoundLevel = toFiniteNumber(soundLevel);
  const normalizedTemperature = toFiniteNumber(temperature);
  const normalizedHumidity = toFiniteNumber(humidity);

  if (normalizedSoundLevel !== undefined) {
    if (normalizedSoundLevel >= 76) {
      reasons.push({
        metric: 'Sound',
        severity: 'Critical',
        message: `Sound is very high (${normalizedSoundLevel.toFixed(1)} dB), which may indicate active swarming, agitation, or a nearby disturbance.`,
      });
    } else if (normalizedSoundLevel >= 61) {
      reasons.push({
        metric: 'Sound',
        severity: 'Warning',
        message: `Sound is elevated (${normalizedSoundLevel.toFixed(1)} dB), which may indicate increased fanning or mild colony stress.`,
      });
    } else {
      reasons.push({
        metric: 'Sound',
        severity: 'Healthy',
        message: `Sound is within the normal activity range (${normalizedSoundLevel.toFixed(1)} dB), consistent with a steady colony.`,
      });
    }
  }

  if (normalizedTemperature !== undefined) {
    if (normalizedTemperature < 10 || normalizedTemperature > 40) {
      reasons.push({
        metric: 'Temperature',
        severity: 'Critical',
        message: `Temperature is dangerous (${normalizedTemperature.toFixed(1)} °C), which can cause cluster failure, brood death, or comb damage.`,
      });
    } else if (normalizedTemperature < 30 || normalizedTemperature > 36.5) {
      reasons.push({
        metric: 'Temperature',
        severity: 'Warning',
        message: `Temperature is outside the moderate range (${normalizedTemperature.toFixed(1)} °C), increasing cold stress or heat-management demands.`,
      });
    } else {
      reasons.push({
        metric: 'Temperature',
        severity: 'Healthy',
        message: `Temperature is in the healthy brood-management range (${normalizedTemperature.toFixed(1)} °C).`,
      });
    }
  }

  if (normalizedHumidity !== undefined) {
    if (normalizedHumidity < 10 || normalizedHumidity > 90) {
      reasons.push({
        metric: 'Humidity',
        severity: 'Critical',
        message: `Humidity is dangerous (${normalizedHumidity.toFixed(1)}%), increasing extreme dryness or fungal-growth risk.`,
      });
    } else if (normalizedHumidity < 40 || normalizedHumidity > 70) {
      reasons.push({
        metric: 'Humidity',
        severity: 'Warning',
        message: `Humidity is outside the moderate range (${normalizedHumidity.toFixed(1)}%), which can contribute to larval desiccation or impaired evaporative cooling.`,
      });
    } else {
      reasons.push({
        metric: 'Humidity',
        severity: 'Healthy',
        message: `Humidity is in the healthy colony range (${normalizedHumidity.toFixed(1)}%), supporting brood and moisture balance.`,
      });
    }
  }

  return reasons;
};

export const calculateBeeStress = (
  soundLevel: number | string | undefined,
  temperature?: number | string,
  humidity?: number | string
): BeeStressLevel => {
  return maxStress(
    calculateSoundStress(soundLevel),
    calculateTemperatureStress(temperature),
    calculateHumidityStress(humidity)
  );
};

export const calculateStressResponse = (soundLevel: number, temperature?: number, humidity?: number) => {
  return {
    beeStress: calculateBeeStress(soundLevel, temperature, humidity),
    stressReasons: calculateStressReasons(soundLevel, temperature, humidity),
    soundLevel,
    temperature,
    humidity,
  };
};

export const getStressColor = (stress: BeeStressLevel): string => {
  switch (stress) {
    case 'Healthy':
      return '#6BA36F';
    case 'Warning':
      return '#D9A25F';
    case 'Critical':
      return '#D9534F';
    default:
      return '#2E2E2E';
  }
};
