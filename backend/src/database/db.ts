import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';

const getBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
};

const createPoolConfig = (): PoolConfig => {
  const databaseUrl = process.env.DATABASE_URL;
  const useSsl = getBoolean(process.env.DB_SSL, Boolean(databaseUrl));
  const rejectUnauthorized = getBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);

  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      ssl: useSsl
        ? {
            rejectUnauthorized,
          }
        : undefined,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'beehayb',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: useSsl
      ? {
          rejectUnauthorized,
        }
      : undefined,
  };
};

const pool = new Pool(createPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]): Promise<QueryResult> => {
  return pool.query(text, params);
};

export const getClient = (): Promise<PoolClient> => {
  return pool.connect();
};

export const connectDatabase = async (): Promise<void> => {
  await pool.query('SELECT 1');
  console.log('PostgreSQL connected');
};

export const closeDatabase = async (): Promise<void> => {
  await pool.end();
  console.log('PostgreSQL pool closed');
};

export default pool;
