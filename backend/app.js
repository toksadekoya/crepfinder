import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import passport from 'passport';

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
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'crepfinder-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/listings', listingsRouter);
app.use('/api/users', usersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/conditions', conditionsRouter);
app.use('/api/trust', trustRouter);
app.use('/api/study', studyRouter);
app.use('/api/research', researchRouter);
app.use('/api/social-verification', socialVerificationRouter);
app.use('/api/auth', authRouter);
app.use('/api/purchase-requests', purchaseRequestsRouter);
app.use('/api/messages', messagesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
