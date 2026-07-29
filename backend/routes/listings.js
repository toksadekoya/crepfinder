import { Router } from 'express';
import pool from '../database/db.js';
import { normalizeParticipantCode } from '../lib/participantCodes.js';

const router = Router();
const allowedConditions = new Set(['New', 'Like New', 'Good', 'Fair', 'Poor']);

function normalizeText(value, limit) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, limit) : null;
}

function parseNumber(value, { min, max } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (min != null && number < min) return null;
  if (max != null && number > max) return null;
  return number;
}

const socialVerificationSelect = `
  (
    SELECT json_build_object(
      'platform', sv.platform,
      'profile_url', sv.profile_url,
      'username', sv.username,
      'status', sv.status,
      'verified_at', sv.verified_at
    )
    FROM social_verifications sv
    WHERE sv.user_id = u.id
    ORDER BY
      CASE sv.status
        WHEN 'verified' THEN 1
        WHEN 'submitted' THEN 2
        WHEN 'pending' THEN 3
        ELSE 4
      END,
      sv.updated_at DESC
    LIMIT 1
  ) AS seller_social_verification
`;

function mutualConnectionsSelect(participantPlaceholder = '$1') {
  return `
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', mc.id,
          'connection_label', mc.connection_label,
          'connection_handle', mc.connection_handle,
          'relationship_context', mc.relationship_context
        )
        ORDER BY mc.id
      )
      FROM mutual_connections mc
      WHERE mc.seller_id = u.id
        AND (mc.participant_code IS NULL OR mc.participant_code = ${participantPlaceholder})
    ), '[]'::json) AS seller_mutual_connections,
    (
      SELECT COUNT(*)::int
      FROM mutual_connections mc
      WHERE mc.seller_id = u.id
        AND (mc.participant_code IS NULL OR mc.participant_code = ${participantPlaceholder})
    ) AS seller_mutual_connection_count
  `;
}

// GET /api/listings
router.get('/', async (req, res) => {
  const participantCode = normalizeParticipantCode(req.query.participant_code);

  try {
    const result = await pool.query(`
      SELECT l.*, u.username AS seller_username, u.id AS seller_id,
        u.created_at AS seller_created_at,
        u.auth_provider AS seller_auth_provider,
        u.oauth_email_verified AS seller_oauth_email_verified,
        (SELECT COUNT(*) FROM listings WHERE user_id = u.id) AS seller_total_listings,
        (SELECT AVG(r2.rating)::NUMERIC(3,2)
         FROM reviews r2
         JOIN listings l2 ON r2.listing_id = l2.id
         WHERE l2.user_id = u.id) AS seller_avg_rating,
        (SELECT COUNT(*)
         FROM reviews r2
         JOIN listings l2 ON r2.listing_id = l2.id
         WHERE l2.user_id = u.id) AS seller_review_count,
        ${socialVerificationSelect},
        ${mutualConnectionsSelect('$1')}
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'active'
      ORDER BY l.created_at DESC
    `, [participantCode]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

router.get('/mine', async (req, res) => {
  const userId = req.session?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Sign in to view seller listings' });
  }

  try {
    const result = await pool.query(
      `SELECT l.*
       FROM listings l
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch seller listings' });
  }
});

router.post('/', async (req, res) => {
  const userId = req.session?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Sign in before creating listings' });
  }

  const brand = normalizeText(req.body?.brand, 100);
  const model = normalizeText(req.body?.model, 150);
  const size = parseNumber(req.body?.size, { min: 1, max: 16 });
  const condition = normalizeText(req.body?.condition, 50);
  const price = parseNumber(req.body?.price, { min: 1, max: 10000 });
  const description = normalizeText(req.body?.description, 2000);
  const imageUrl = normalizeText(req.body?.image_url, 1000);

  if (!brand || !model || !size || !condition || !allowedConditions.has(condition) || !price) {
    return res.status(400).json({
      error: 'brand, model, size, condition, and price are required',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO listings
        (user_id, brand, model, size, condition, price, description, image_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING id, user_id, brand, model, size, condition, price, description, image_url, status, created_at`,
      [userId, brand, model, size, condition, price, description, imageUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  const participantCode = normalizeParticipantCode(req.query.participant_code);

  try {
    const { id } = req.params;
    const listingResult = await pool.query(`
      SELECT l.*, u.username AS seller_username, u.id AS seller_id,
        u.created_at AS seller_created_at,
        u.auth_provider AS seller_auth_provider,
        u.oauth_email_verified AS seller_oauth_email_verified,
        (SELECT COUNT(*) FROM listings WHERE user_id = u.id) AS seller_total_listings,
        (SELECT AVG(r2.rating)::NUMERIC(3,2)
         FROM reviews r2
         JOIN listings l2 ON r2.listing_id = l2.id
         WHERE l2.user_id = u.id) AS seller_avg_rating,
        (SELECT COUNT(*)
         FROM reviews r2
         JOIN listings l2 ON r2.listing_id = l2.id
         WHERE l2.user_id = u.id) AS seller_review_count,
        ${socialVerificationSelect},
        ${mutualConnectionsSelect('$1')}
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = $2
        AND l.status = 'active'
    `, [participantCode, id]);

    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(listingResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

export default router;
