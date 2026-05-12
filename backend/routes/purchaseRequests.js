import { Router } from 'express';
import pool from '../database/db.js';
import { normalizeParticipantCode } from '../lib/participantCodes.js';

const router = Router();

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.post('/', async (req, res) => {
  const listingId = parseId(req.body?.listing_id);
  const participantCode = normalizeParticipantCode(req.body?.participant_code);

  if (!listingId || !participantCode) {
    return res.status(400).json({ error: 'listing_id and participant_code are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO purchase_requests (listing_id, participant_code, status, completed_at)
       VALUES ($1, $2, 'completed', NOW())
       ON CONFLICT (listing_id, participant_code)
       DO UPDATE SET status = 'completed', completed_at = COALESCE(purchase_requests.completed_at, NOW())
       RETURNING id, listing_id, participant_code, status, created_at, completed_at`,
      [listingId, participantCode]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
});

router.get('/eligibility', async (req, res) => {
  const listingId = parseId(req.query.listing_id);
  const participantCode = normalizeParticipantCode(req.query.participant_code);

  if (!listingId || !participantCode) {
    return res.status(400).json({ error: 'listing_id and participant_code are required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, status, completed_at
       FROM purchase_requests
       WHERE listing_id = $1
         AND participant_code = $2
         AND status = 'completed'`,
      [listingId, participantCode]
    );

    res.json({
      eligible: result.rows.length > 0,
      purchase_request: result.rows[0] ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check review eligibility' });
  }
});

export default router;
