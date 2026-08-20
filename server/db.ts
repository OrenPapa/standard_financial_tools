import './config/env.js';

import pg from 'pg';
import type { PoolConfig } from 'pg';

const { Pool } = pg;

export interface DatabaseStatus {
  database: string;
  user: string;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readDbPort(): number {
  const rawPort = optionalEnv('DB_PORT');

  if (!rawPort) {
    return 5432;
  }

  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('DB_PORT must be a positive integer.');
  }

  return port;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(
    optionalEnv('DB_USER') &&
    optionalEnv('DB_PASSWORD') &&
    optionalEnv('DB_HOST') &&
    optionalEnv('DB_NAME')
  );
}

export const dbConfig: PoolConfig = {
  user: optionalEnv('DB_USER'),
  host: optionalEnv('DB_HOST') || 'localhost',
  database: optionalEnv('DB_NAME'),
  password: optionalEnv('DB_PASSWORD'),
  port: readDbPort()
};

export const db = new Pool(dbConfig);

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const result = await db.query<DatabaseStatus>(
    'select current_database() as database, current_user as "user"'
  );

  return result.rows[0];
}
