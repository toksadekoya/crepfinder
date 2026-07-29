import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import dotenv from 'dotenv';
import { createPoolConfig } from './poolConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { Pool } = pg;

dotenv.config();

const migrationConnectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool(createPoolConfig(migrationConnectionString));

try {
  const schema = await readFile(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Database schema prepared successfully.');
} catch (err) {
  console.error('Database schema preparation failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
