export type BeeStressLevel = 'Healthy' | 'Warning' | 'Critical';

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

  if (normalizedTemperature < 18 || normalizedTemperature > 36) {
    return 'Warning';
  }

  return 'Healthy';
};

const calculateHumidityStress = (humidity?: number | string): BeeStressLevel => {
  const normalizedHumidity = toFiniteNumber(humidity);

  if (normalizedHumidity === undefined) {
    return 'Healthy';
  }

  if (normalizedHumidity < 30 || normalizedHumidity > 85) {
    return 'Critical';
  }

  if (normalizedHumidity < 40 || normalizedHumidity > 75) {
    return 'Warning';
  }

  return 'Healthy';
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
