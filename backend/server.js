import app from './app.js';
import pool from './database/db.js';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);

  server.close(async (err) => {
    if (err) {
      console.error('HTTP server shutdown failed:', err);
      process.exitCode = 1;
    }

    try {
      await pool.end();
    } catch (poolError) {
      console.error('Database pool shutdown failed:', poolError);
      process.exitCode = 1;
    }
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
