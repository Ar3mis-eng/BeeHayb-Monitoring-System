export type BeeStressLevel = 'Healthy' | 'Warning' | 'Critical';

export const calculateBeeStress = (soundLevel: number): BeeStressLevel => {
  if (soundLevel >= 76) {
    return 'Critical';
  } else if (soundLevel >= 61) {
    return 'Warning';
  } else {
    return 'Healthy';
  }
};

export const calculateStressResponse = (soundLevel: number) => {
  return {
    beeStress: calculateBeeStress(soundLevel),
    soundLevel,
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
