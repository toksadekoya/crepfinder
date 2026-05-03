import { Router } from 'express';
import pool from '../database/db.js';

const router = Router();

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeParticipantCode(value) {
  const code = String(value ?? '').trim().toUpperCase();
  return /^P[0-9]{3}$/.test(code) ? code : null;
}

function normalizeBody(value) {
  const body = String(value ?? '').trim();
  return body ? body.slice(0, 1000) : null;
}

router.get('/', async (req, res) => {
  const listingId = parseId(req.query.listing_id);
  const participantCode = normalizeParticipantCode(req.query.participant_code);

  if (!listingId || !participantCode) {
    return res.status(400).json({ error: 'listing_id and participant_code are required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, listing_id, seller_id, participant_code, sender_role, body, created_at
       FROM messages
       WHERE listing_id = $1
         AND participant_code = $2
       ORDER BY created_at ASC`,
      [listingId, participantCode]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/', async (req, res) => {
  const listingId = parseId(req.body?.listing_id);
  const participantCode = normalizeParticipantCode(req.body?.participant_code);
  const body = normalizeBody(req.body?.body);

  if (!listingId || !participantCode || !body) {
    return res.status(400).json({ error: 'listing_id, participant_code, and body are required' });
  }

  try {
    const listing = await pool.query(
      'SELECT user_id FROM listings WHERE id = $1',
      [listingId]
    );

    if (listing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const result = await pool.query(
      `INSERT INTO messages (listing_id, seller_id, participant_code, sender_role, body)
       VALUES ($1, $2, $3, 'participant', $4)
       RETURNING id, listing_id, seller_id, participant_code, sender_role, body, created_at`,
      [listingId, listing.rows[0].user_id, participantCode, body]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
