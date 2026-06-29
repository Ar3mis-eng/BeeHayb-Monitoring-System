import { SensorReadingModel } from './models/SensorReading';
import { query } from './database/db';

const generateMockSensorData = async () => {
  console.log('Generating mock sensor data...');

  const hiveIds = [1, 2, 3];
  const now = new Date();

  try {
    // Generate 24 hours of data for each hive (hourly readings)
    for (const hiveId of hiveIds) {
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);

        // Generate realistic sensor values
        const baseTemp = 28 + Math.sin(i / 24) * 5;
        const temperature = baseTemp + (Math.random() - 0.5) * 2;

        const baseHumidity = 60 + Math.cos(i / 24) * 10;
        const humidity = Math.max(30, Math.min(90, baseHumidity + (Math.random() - 0.5) * 5));

        const baseSoundLevel = 50 + Math.sin(i / 12) * 20;
        const soundLevel = Math.max(40, Math.min(90, baseSoundLevel + (Math.random() - 0.5) * 10));

        // Determine bee stress based on sound level
        let beeStress = 'Healthy';
        if (soundLevel >= 76) {
          beeStress = 'Critical';
        } else if (soundLevel >= 61) {
          beeStress = 'Warning';
        }

        // Insert into database
        await query(
          `INSERT INTO sensor_readings 
           (hive_id, temperature, humidity, sound_level, bee_stress_status, recorded_at) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [hiveId, temperature.toFixed(2), humidity.toFixed(2), soundLevel.toFixed(2), beeStress, timestamp]
        );
      }
    }

    console.log('Mock sensor data generated successfully');
  } catch (error) {
    console.error('Error generating mock data:', error);
  }

  process.exit(0);
};

generateMockSensorData();
