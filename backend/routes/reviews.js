import { Router } from 'express';
import pool from '../database/db.js';
import { normalizeParticipantCode } from '../lib/participantCodes.js';

const router = Router();

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/reviews/:listingId
router.get('/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const result = await pool.query(`
      SELECT r.*, u.username AS reviewer_username,
        pr.status AS purchase_status,
        pr.completed_at AS purchase_completed_at
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      LEFT JOIN purchase_requests pr ON r.purchase_request_id = pr.id
      WHERE r.listing_id = $1
      ORDER BY r.created_at DESC
    `, [listingId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews
router.post('/', async (req, res) => {
  const listingId = parseId(req.body?.listing_id);
  const reviewerId = parseId(req.body?.reviewer_id ?? req.session.userId);
  const participantCode = normalizeParticipantCode(req.body?.participant_code);
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment ?? '').trim().slice(0, 1000);

  if (!listingId || !reviewerId || !participantCode || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      error: 'listing_id, reviewer_id, participant_code, and rating from 1 to 5 are required',
    });
  }

  try {
    const purchase = await pool.query(
      `SELECT id
       FROM purchase_requests
       WHERE listing_id = $1
         AND participant_code = $2
         AND status = 'completed'
       LIMIT 1`,
      [listingId, participantCode]
    );

    if (purchase.rows.length === 0) {
      return res.status(403).json({
        error: 'Reviews are locked until a completed purchase request exists for this listing',
      });
    }

    const result = await pool.query(
      `INSERT INTO reviews
        (listing_id, reviewer_id, purchase_request_id, rating, comment, is_transaction_locked)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, listing_id, reviewer_id, purchase_request_id, rating, comment, is_transaction_locked, created_at`,
      [listingId, reviewerId, purchase.rows[0].id, rating, comment || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This reviewer has already reviewed this listing' });
    }

    console.error(err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

export default router;
