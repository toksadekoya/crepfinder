import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const schema = await readFile(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Database schema initialized successfully!');
} catch (err) {
  console.error('Schema initialization failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
