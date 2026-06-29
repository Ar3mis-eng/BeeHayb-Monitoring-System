import { query } from '../database/db';

export interface SensorReading {
  id: number;
  hive_id: number;
  device_id?: number;
  temperature?: number;
  humidity?: number;
  sound_level?: number;
  bee_stress_status: string;
  recorded_at: Date;
}

export const SensorReadingModel = {
  async findAll(): Promise<SensorReading[]> {
    const result = await query('SELECT * FROM sensor_readings ORDER BY recorded_at DESC LIMIT 1000');
    return result.rows;
  },

  async findByHiveId(hiveId: number, limit: number = 100): Promise<SensorReading[]> {
    const result = await query(
      'SELECT * FROM sensor_readings WHERE hive_id = $1 ORDER BY recorded_at DESC LIMIT $2',
      [hiveId, limit]
    );
    return result.rows;
  },

  async findByHiveIdAndTimeRange(
    hiveId: number,
    startTime: Date,
    endTime: Date,
    limit: number = 1000
  ): Promise<SensorReading[]> {
    const result = await query(
      `SELECT * FROM sensor_readings 
       WHERE hive_id = $1 AND recorded_at >= $2 AND recorded_at <= $3 
       ORDER BY recorded_at DESC LIMIT $4`,
      [hiveId, startTime, endTime, limit]
    );
    return result.rows;
  },

  async findLatestByHiveId(hiveId: number): Promise<SensorReading | null> {
    const result = await query(
      'SELECT * FROM sensor_readings WHERE hive_id = $1 ORDER BY recorded_at DESC LIMIT 1',
      [hiveId]
    );
    return result.rows[0] || null;
  },

  async create(
    hiveId: number,
    temperature: number,
    humidity: number,
    soundLevel: number,
    beeStressStatus: string,
    deviceId?: number
  ): Promise<SensorReading> {
    const result = await query(
      `INSERT INTO sensor_readings 
       (hive_id, device_id, temperature, humidity, sound_level, bee_stress_status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [hiveId, deviceId || null, temperature, humidity, soundLevel, beeStressStatus]
    );
    return result.rows[0];
  },

  async deleteOldReadings(daysToKeep: number = 90): Promise<number> {
    const result = await query(
      `DELETE FROM sensor_readings 
       WHERE recorded_at < NOW() - INTERVAL '${daysToKeep} days'`
    );
    return result.rowCount || 0;
  },
};
