function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function createPoolConfig(connectionString = process.env.DATABASE_URL) {
  const sharedOptions = {
    max: parsePositiveInteger(process.env.DB_POOL_MAX, 10),
    idleTimeoutMillis: parsePositiveInteger(process.env.DB_IDLE_TIMEOUT_MS, 30000),
    connectionTimeoutMillis: parsePositiveInteger(process.env.DB_CONNECT_TIMEOUT_MS, 10000),
  };

  if (connectionString) {
    return {
      ...sharedOptions,
      connectionString,
      ssl: process.env.DB_SSL === 'false'
        ? false
        : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' },
    };
  }

  return {
    ...sharedOptions,
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'crepfinder',
    password: process.env.DB_PASSWORD || 'postgres',
    port: Number.parseInt(process.env.DB_PORT, 10) || 5432,
  };
}
