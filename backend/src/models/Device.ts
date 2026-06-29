import { query } from '../database/db';

export interface Device {
  id: number;
  device_name: string;
  esp32_serial: string;
  hive_id: number;
  status: string;
  last_seen: Date;
  created_at: Date;
  updated_at: Date;
}

export const DeviceModel = {
  async findAll(): Promise<Device[]> {
    const result = await query('SELECT * FROM devices ORDER BY created_at DESC');
    return result.rows;
  },

  async findById(id: number): Promise<Device | null> {
    const result = await query('SELECT * FROM devices WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByHiveId(hiveId: number): Promise<Device[]> {
    const result = await query('SELECT * FROM devices WHERE hive_id = $1 ORDER BY created_at DESC', [hiveId]);
    return result.rows;
  },

  async findBySerial(serial: string): Promise<Device | null> {
    const result = await query('SELECT * FROM devices WHERE esp32_serial = $1', [serial]);
    return result.rows[0] || null;
  },

  async create(deviceName: string, esp32Serial: string, hiveId: number, status: string = 'active'): Promise<Device> {
    const result = await query(
      'INSERT INTO devices (device_name, esp32_serial, hive_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [deviceName, esp32Serial, hiveId, status]
    );
    return result.rows[0];
  },

  async update(id: number, deviceName: string, status: string): Promise<Device | null> {
    const result = await query(
      'UPDATE devices SET device_name = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [deviceName, status, id]
    );
    return result.rows[0] || null;
  },

  async updateLastSeen(id: number): Promise<Device | null> {
    const result = await query(
      'UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM devices WHERE id = $1', [id]);
    return result.rowCount! > 0;
  },
};
