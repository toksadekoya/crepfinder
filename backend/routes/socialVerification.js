import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import pool from '../database/db.js';

const router = Router();
const allowedStatuses = new Set(['pending', 'submitted', 'verified', 'rejected']);

function generateChallengeCode() {
  return `CREPFINDER-${randomBytes(3).toString('hex').toUpperCase()}`;
}

function normalizePlatform(platform) {
  return String(platform ?? '').trim().slice(0, 50);
}

function normalizeOptionalText(value, limit = 500) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, limit) : null;
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function publicFields(row) {
  if (!row) return null;

  return {
    id: row.id,
    user_id: row.user_id,
    platform: row.platform,
    profile_url: row.profile_url,
    username: row.username,
    status: row.status,
    verified_at: row.verified_at,
    updated_at: row.updated_at,
  };
}

function publicSellerFields(row) {
  if (!row) return null;

  return {
    platform: row.platform,
    profile_url: row.profile_url,
    username: row.username,
    status: row.status,
    verified_at: row.verified_at,
  };
}

function requireAdminToken(req, res, next) {
  const configuredToken = process.env.SOCIAL_VERIFICATION_ADMIN_TOKEN;

  if (!configuredToken && process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  const suppliedToken = req.get('x-admin-token') || req.query.token;

  if (configuredToken && suppliedToken === configuredToken) {
    next();
    return;
  }

  res.status(401).json({ error: 'Admin token required' });
}

async function createChallenge(client) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const code = generateChallengeCode();
    const existing = await client.query(
      'SELECT id FROM social_verifications WHERE challenge_code = $1',
      [code]
    );

    if (existing.rows.length === 0) return code;
  }

  throw new Error('Unable to generate unique challenge code');
}

router.post('/start', async (req, res) => {
  const userId = parseId(req.body?.user_id ?? req.body?.seller_id);
  const platform = normalizePlatform(req.body?.platform);
  const profileUrl = normalizeOptionalText(req.body?.profile_url, 1000);
  const username = normalizeOptionalText(req.body?.username, 100);

  if (!userId || !platform || (!profileUrl && !username)) {
    return res.status(400).json({
      error: 'user_id, platform, and either profile_url or username are required',
    });
  }

  const client = await pool.connect();

  try {
    const user = await client.query('SELECT id FROM users WHERE id = $1', [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const challengeCode = await createChallenge(client);
    const result = await client.query(
      `INSERT INTO social_verifications
        (user_id, platform, profile_url, username, challenge_code, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [userId, platform, profileUrl, username, challengeCode]
    );

    res.status(201).json({
      ...publicFields(result.rows[0]),
      challenge_code: result.rows[0].challenge_code,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start social verification' });
  } finally {
    client.release();
  }
});

router.post('/submit', async (req, res) => {
  const id = parseId(req.body?.id ?? req.body?.verification_id);
  const userId = parseId(req.body?.user_id ?? req.body?.seller_id);
  const evidenceUrl = normalizeOptionalText(req.body?.evidence_url, 1000);
  const evidenceText = normalizeOptionalText(req.body?.evidence_text, 1000);

  if (!id || !userId || (!evidenceUrl && !evidenceText)) {
    return res.status(400).json({
      error: 'verification id, user_id, and evidence_url or evidence_text are required',
    });
  }

  try {
    const result = await pool.query(
      `UPDATE social_verifications
       SET evidence_url = $1,
           evidence_text = $2,
           status = 'submitted',
           updated_at = NOW(),
           verified_at = NULL
       WHERE id = $3
         AND user_id = $4
         AND status IN ('pending', 'submitted', 'rejected')
       RETURNING *`,
      [evidenceUrl, evidenceText, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    res.json(publicFields(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit verification evidence' });
  }
});

router.get('/me', async (req, res) => {
  const userId = parseId(req.query.user_id ?? req.query.seller_id);

  if (!userId) {
    return res.status(400).json({ error: 'user_id query parameter is required' });
  }

  try {
    const result = await pool.query(
      `SELECT *
       FROM social_verifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows.map((row) => ({
      ...publicFields(row),
      challenge_code: row.challenge_code,
      evidence_url: row.evidence_url,
      evidence_text: row.evidence_text,
      admin_notes: row.admin_notes,
      created_at: row.created_at,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch verification requests' });
  }
});

router.get('/seller/:sellerId', async (req, res) => {
  const sellerId = parseId(req.params.sellerId);

  if (!sellerId) {
    return res.status(400).json({ error: 'Valid seller id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, user_id, platform, profile_url, username, status, verified_at, updated_at
       FROM social_verifications
       WHERE user_id = $1
       ORDER BY
         CASE status
           WHEN 'verified' THEN 1
           WHEN 'submitted' THEN 2
           WHEN 'pending' THEN 3
           ELSE 4
         END,
         updated_at DESC
       LIMIT 1`,
      [sellerId]
    );

    res.json(publicSellerFields(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch seller verification' });
  }
});

async function updateStatus(req, res, status) {
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ error: 'Unsupported status' });
  }

  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Valid verification id is required' });
  }

  const adminNotes = normalizeOptionalText(req.body?.admin_notes, 1000);

  try {
    const result = await pool.query(
      `UPDATE social_verifications
       SET status = $1,
           admin_notes = COALESCE($2, admin_notes),
           updated_at = NOW(),
           verified_at = CASE WHEN $1 = 'verified' THEN NOW() ELSE NULL END
       WHERE id = $3
       RETURNING *`,
      [status, adminNotes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    res.json(publicFields(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `Failed to mark verification as ${status}` });
  }
}

router.post('/:id/approve', requireAdminToken, (req, res) => updateStatus(req, res, 'verified'));
router.post('/:id/reject', requireAdminToken, (req, res) => updateStatus(req, res, 'rejected'));

export default router;
