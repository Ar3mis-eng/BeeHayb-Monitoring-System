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

const calculateSoundStress = (soundLevel: number): BeeStressLevel => {
  if (soundLevel >= 76) {
    return 'Critical';
  }

  if (soundLevel >= 61) {
    return 'Warning';
  }

  return 'Healthy';
};

const calculateTemperatureStress = (temperature?: number): BeeStressLevel => {
  if (temperature === undefined || Number.isNaN(temperature)) {
    return 'Healthy';
  }

  if (temperature < 10 || temperature > 40) {
    return 'Critical';
  }

  if (temperature < 18 || temperature > 36) {
    return 'Warning';
  }

  return 'Healthy';
};

const calculateHumidityStress = (humidity?: number): BeeStressLevel => {
  if (humidity === undefined || Number.isNaN(humidity)) {
    return 'Healthy';
  }

  if (humidity < 30 || humidity > 85) {
    return 'Critical';
  }

  if (humidity < 40 || humidity > 75) {
    return 'Warning';
  }

  return 'Healthy';
};

export const calculateBeeStress = (
  soundLevel: number,
  temperature?: number,
  humidity?: number
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
