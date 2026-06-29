import { query } from '../database/db';

export interface Hive {
  id: number;
  hive_name: string;
  location: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export const HiveModel = {
  async findAll(): Promise<Hive[]> {
    const result = await query('SELECT * FROM hives ORDER BY created_at DESC');
    return result.rows;
  },

  async findById(id: number): Promise<Hive | null> {
    const result = await query('SELECT * FROM hives WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(hiveName: string, location: string, description?: string): Promise<Hive> {
    const result = await query(
      'INSERT INTO hives (hive_name, location, description) VALUES ($1, $2, $3) RETURNING *',
      [hiveName, location, description]
    );
    return result.rows[0];
  },

  async update(id: number, hiveName: string, location: string, description?: string): Promise<Hive | null> {
    const result = await query(
      'UPDATE hives SET hive_name = $1, location = $2, description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [hiveName, location, description, id]
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM hives WHERE id = $1', [id]);
    return result.rowCount! > 0;
  },
};
