import '../config/env.js';

import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { db } from '../db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, '..', 'migrations');

await db.query(`
  create table if not exists schema_migrations (
    id text primary key,
    applied_at timestamptz not null default now()
  )
`);

const applied = await db.query<{ id: string }>('select id from schema_migrations');
const appliedIds = new Set(applied.rows.map(row => row.id));
const migrationFiles = (await readdir(migrationsDir))
  .filter(file => file.endsWith('.sql'))
  .sort();

for (const migrationFile of migrationFiles) {
  if (appliedIds.has(migrationFile)) {
    console.log(`skip ${migrationFile}`);
    continue;
  }

  const sql = await readFile(resolve(migrationsDir, migrationFile), 'utf8');

  await db.query('begin');
  try {
    await db.query(sql);
    await db.query('insert into schema_migrations (id) values ($1)', [migrationFile]);
    await db.query('commit');
    console.log(`applied ${migrationFile}`);
  } catch (error) {
    await db.query('rollback');
    throw error;
  }
}

await db.end();
