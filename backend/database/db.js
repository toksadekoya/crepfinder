import pg from 'pg';
import dotenv from 'dotenv';
import { createPoolConfig } from './poolConfig.js';

dotenv.config();

const { Pool } = pg;
const pool = new Pool(createPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export default pool;
