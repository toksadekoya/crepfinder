import { Router } from 'express';
import pool from '../database/db.js';

const router = Router();

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

// GET /api/listings
router.get('/', async (req, res) => {
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
        ${socialVerificationSelect}
      FROM listings l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
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
        ${socialVerificationSelect}
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = $1
    `, [id]);

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
