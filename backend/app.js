import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import passport from 'passport';

import pool from './database/db.js';
import { isProduction, isResearchModeEnabled } from './lib/runtime.js';
import listingsRouter from './routes/listings.js';
import usersRouter from './routes/users.js';
import reviewsRouter from './routes/reviews.js';
import conditionsRouter from './routes/conditions.js';
import trustRouter from './routes/trust.js';
import studyRouter from './routes/study.js';
import researchRouter from './routes/research.js';
import socialVerificationRouter from './routes/socialVerification.js';
import authRouter from './routes/auth.js';
import purchaseRequestsRouter from './routes/purchaseRequests.js';
import messagesRouter from './routes/messages.js';

dotenv.config();

const app = express();
const production = isProduction();
const researchRoutesEnabled = isResearchModeEnabled();
const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDist = join(__dirname, '..', 'frontend', 'dist');
const sessionCookieName = 'crepfinder.sid';

function normalizeOrigin(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

function getAllowedOrigins() {
  const configured = [
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS || '').split(','),
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  if (!production) {
    configured.push('http://localhost:5173', 'http://127.0.0.1:5173');
  }

  return [...new Set(configured)];
}

function validateProductionConfiguration() {
  if (!production) return;

  const required = ['DATABASE_URL', 'SESSION_SECRET', 'FRONTEND_ORIGIN', 'BACKEND_PUBLIC_URL'];
  const missing = required.filter((name) => !String(process.env[name] ?? '').trim());

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  if (process.env.SESSION_SECRET.length < 32 || process.env.SESSION_SECRET.includes('replace-with')) {
    throw new Error('SESSION_SECRET must be a unique random value of at least 32 characters');
  }

  if (process.env.SOCIAL_VERIFICATION_ADMIN_TOKEN) {
    if (
      process.env.SOCIAL_VERIFICATION_ADMIN_TOKEN.length < 24
      || process.env.SOCIAL_VERIFICATION_ADMIN_TOKEN.includes('replace-with')
    ) {
      throw new Error('SOCIAL_VERIFICATION_ADMIN_TOKEN must be a unique random value of at least 24 characters');
    }
  }

  for (const name of ['FRONTEND_ORIGIN', 'BACKEND_PUBLIC_URL']) {
    if (!normalizeOrigin(process.env[name])) {
      throw new Error(`${name} must be an absolute http(s) URL`);
    }
  }
}

validateProductionConfiguration();

const allowedOrigins = getAllowedOrigins();
const PostgresSessionStore = connectPgSimple(session);
const cookieSameSite = process.env.COOKIE_SAME_SITE || 'lax';
const sessionStore = production || process.env.SESSION_STORE === 'postgres'
  ? new PostgresSessionStore({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
      pruneSessionInterval: 15 * 60,
    })
  : undefined;

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", ...allowedOrigins],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
      callback(null, true);
      return;
    }

    const error = new Error('Origin is not allowed');
    error.status = 403;
    callback(error);
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(session({
  name: sessionCookieName,
  secret: process.env.SESSION_SECRET || 'crepfinder-local-development-secret',
  store: sessionStore,
  proxy: production,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: production,
    sameSite: cookieSameSite,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', database: 'ok' });
  } catch (err) {
    console.error('Readiness check failed:', err);
    res.status(503).json({ status: 'not_ready', database: 'unavailable' });
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/api/listings', listingsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/social-verification', socialVerificationRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/purchase-requests', purchaseRequestsRouter);
app.use('/api/messages', messagesRouter);

if (researchRoutesEnabled) {
  app.use('/api/users', usersRouter);
  app.use('/api/conditions', conditionsRouter);
  app.use('/api/trust', trustRouter);
  app.use('/api/study', studyRouter);
  app.use('/api/research', researchRouter);
} else {
  app.use(
    ['/api/users', '/api/conditions', '/api/trust', '/api/study', '/api/research'],
    (req, res) => {
      res.status(404).json({ error: 'Research routes are disabled in this deployment' });
    }
  );
}

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

if (process.env.SERVE_FRONTEND === 'true') {
  app.use(express.static(frontendDist, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.includes(`${join('dist', 'assets')}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  }));

  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(join(frontendDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
});

export { sessionCookieName };
export default app;
