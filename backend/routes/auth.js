import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../database/db.js';

const router = Router();
const googleScopes = ['openid', 'email', 'profile'];
let passportConfigured = false;

function hasGoogleOAuthConfig() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function getFrontendOrigin(req) {
  const configured = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL;
  if (configured) return configured;

  const origin = req.get('origin');
  if (origin) return origin;

  const referer = req.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return 'http://localhost:5173';
    }
  }

  return 'http://localhost:5173';
}

function getBackendOrigin(req) {
  if (process.env.BACKEND_PUBLIC_URL) return process.env.BACKEND_PUBLIC_URL;
  return `${req.protocol}://${req.get('host')}`;
}

function getRedirectUri(req) {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI || `${getBackendOrigin(req)}/api/auth/google/callback`;
}

function callbackUrl(req, status, reason = '') {
  const frontendOrigin = req.session.oauthFrontendOrigin || getFrontendOrigin(req);
  const url = new URL('/auth/callback', frontendOrigin);
  url.searchParams.set('oauth', status);
  if (reason) url.searchParams.set('reason', reason);
  return url.toString();
}

function sanitizeUsername(value) {
  const base = String(value ?? 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);

  return base || `user_${randomBytes(2).toString('hex')}`;
}

async function makeUniqueUsername(client, desiredUsername) {
  const base = sanitizeUsername(desiredUsername);

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}_${attempt}`;
    const existing = await client.query('SELECT id FROM users WHERE username = $1', [candidate]);

    if (existing.rows.length === 0) return candidate;
  }

  return `${base}_${randomBytes(3).toString('hex')}`;
}

function publicUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    auth_provider: row.auth_provider,
    oauth_email_verified: Boolean(row.oauth_email_verified),
    has_google_account: Boolean(row.google_id),
  };
}

async function fetchSessionUser(userId) {
  if (!userId) return null;

  const result = await pool.query(
    `SELECT id, username, email, display_name, avatar_url, auth_provider, oauth_email_verified, google_id
     FROM users
     WHERE id = $1`,
    [userId]
  );

  return publicUser(result.rows[0]);
}

async function upsertGoogleUser(googleUser) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingGoogle = await client.query(
      `UPDATE users
       SET email = $2,
           display_name = $3,
           avatar_url = $4,
           oauth_email_verified = COALESCE($5, oauth_email_verified),
           auth_provider = 'google',
           last_login_at = NOW()
       WHERE google_id = $1
       RETURNING id, username, email, display_name, avatar_url, auth_provider, oauth_email_verified, google_id`,
      [googleUser.sub, googleUser.email, googleUser.name, googleUser.picture, Boolean(googleUser.email_verified)]
    );

    if (existingGoogle.rows.length) {
      await client.query('COMMIT');
      return publicUser(existingGoogle.rows[0]);
    }

    const existingEmail = await client.query(
      `SELECT id, username, email, display_name, avatar_url, auth_provider, oauth_email_verified, google_id
       FROM users
       WHERE email = $1
       FOR UPDATE`,
      [googleUser.email]
    );

    if (existingEmail.rows.length) {
      if (existingEmail.rows[0].google_id && existingEmail.rows[0].google_id !== googleUser.sub) {
        throw new Error('Email is already linked to a different Google account');
      }

      const linked = await client.query(
        `UPDATE users
         SET google_id = $1,
             display_name = COALESCE($2, display_name),
             avatar_url = COALESCE($3, avatar_url),
             oauth_email_verified = COALESCE($4, oauth_email_verified),
             auth_provider = 'google',
             last_login_at = NOW()
         WHERE id = $5
         RETURNING id, username, email, display_name, avatar_url, auth_provider, oauth_email_verified, google_id`,
        [googleUser.sub, googleUser.name, googleUser.picture, Boolean(googleUser.email_verified), existingEmail.rows[0].id]
      );

      await client.query('COMMIT');
      return publicUser(linked.rows[0]);
    }

    const desiredUsername = googleUser.email?.split('@')[0] || googleUser.name;
    const username = await makeUniqueUsername(client, desiredUsername);
    const created = await client.query(
      `INSERT INTO users
        (username, email, password_hash, google_id, display_name, avatar_url, oauth_email_verified, auth_provider, last_login_at)
       VALUES ($1, $2, NULL, $3, $4, $5, $6, 'google', NOW())
       RETURNING id, username, email, display_name, avatar_url, auth_provider, oauth_email_verified, google_id`,
      [username, googleUser.email, googleUser.sub, googleUser.name, googleUser.picture, Boolean(googleUser.email_verified)]
    );

    await client.query('COMMIT');
    return publicUser(created.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function googleProfileToUser(profile) {
  const email = profile.emails?.[0]?.value || profile._json?.email;

  return {
    sub: profile.id,
    email,
    name: profile.displayName || profile._json?.name || email,
    picture: profile.photos?.[0]?.value || profile._json?.picture || null,
    email_verified: profile._json?.email_verified,
  };
}

function configurePassport(req) {
  if (passportConfigured || !hasGoogleOAuthConfig()) return;

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      done(null, await fetchSessionUser(id));
    } catch (err) {
      done(err);
    }
  });

  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: getRedirectUri(req),
      state: true,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleUser = googleProfileToUser(profile);

        if (!googleUser.sub || !googleUser.email) {
          done(null, false, { message: 'Google profile did not include an email address' });
          return;
        }

        if (googleUser.email_verified === false) {
          done(null, false, { message: 'Google email address was not verified' });
          return;
        }

        done(null, await upsertGoogleUser(googleUser));
      } catch (err) {
        done(err);
      }
    }
  ));

  passportConfigured = true;
}

router.get('/status', async (req, res) => {
  try {
    const user = await fetchSessionUser(req.session.userId);

    res.json({
      authenticated: Boolean(user),
      googleOAuthEnabled: hasGoogleOAuthConfig(),
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch auth status' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const user = await fetchSessionUser(req.session.userId);

    if (!user) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

router.get('/google', (req, res) => {
  if (!hasGoogleOAuthConfig()) {
    return res.status(503).json({ error: 'Google OAuth is not configured' });
  }

  req.session.oauthFrontendOrigin = getFrontendOrigin(req);
  configurePassport(req);

  return passport.authenticate('google', {
    scope: googleScopes,
    prompt: 'select_account',
  })(req, res);
});

router.get('/google/callback', (req, res, next) => {
  if (!hasGoogleOAuthConfig()) {
    return res.redirect(callbackUrl(req, 'error', 'not_configured'));
  }

  configurePassport(req);

  return passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error(err);
      return res.redirect(callbackUrl(req, 'error', 'oauth_failed'));
    }

    if (!user) {
      const reason = info?.message === 'Google email address was not verified'
        ? 'email_not_verified'
        : 'oauth_failed';
      return res.redirect(callbackUrl(req, 'error', reason));
    }

    return req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return res.redirect(callbackUrl(req, 'error', 'oauth_failed'));
      }

      req.session.userId = user.id;
      req.session.oauthProvider = 'google';
      return res.redirect(callbackUrl(req, 'success'));
    });
  })(req, res, next);
});

export default router;
