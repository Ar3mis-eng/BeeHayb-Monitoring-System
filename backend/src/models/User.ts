import { query } from '../database/db';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export const UserModel = {
  async findAll(): Promise<User[]> {
    const result = await query('SELECT id, username, email, created_at, updated_at FROM users ORDER BY created_at DESC');
    return result.rows;
  },

  async findById(id: number): Promise<User | null> {
    const result = await query(
      'SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const result = await query(
      'SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  async create(username: string, email: string, passwordHash: string): Promise<User> {
    const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at, updated_at',
      [username, email, passwordHash]
    );
    return result.rows[0];
  },

  async update(id: number, username: string, email: string): Promise<User | null> {
    const result = await query(
      'UPDATE users SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, email, created_at, updated_at',
      [username, email, id]
    );
    return result.rows[0] || null;
  },

  async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    const result = await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, id]
    );
    return result.rowCount! > 0;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount! > 0;
  },
};
