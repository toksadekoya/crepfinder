import { Router } from 'express';
import pool from '../database/db.js';
import { normalizeParticipantCode } from '../lib/participantCodes.js';
import { isResearchModeEnabled } from '../lib/runtime.js';

const router = Router();

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeBody(value) {
  const body = String(value ?? '').trim();
  return body ? body.slice(0, 1000) : null;
}

function normalizeText(value, limit = 160) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, limit) : null;
}

router.get('/me', async (req, res) => {
  const userId = parseId(req.session?.userId);

  if (!userId) {
    return res.status(401).json({ error: 'Sign in to view messages' });
  }

  try {
    const result = await pool.query(
      `SELECT m.id, m.listing_id, m.seller_id, m.buyer_id, m.buyer_email, m.participant_code,
              m.sender_role, m.body, m.created_at,
              l.brand, l.model
       FROM messages m
       JOIN listings l ON m.listing_id = l.id
       WHERE m.seller_id = $1
          OR m.buyer_id = $1
       ORDER BY m.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/', async (req, res) => {
  const listingId = parseId(req.query.listing_id);
  const participantCode = normalizeParticipantCode(req.query.participant_code);
  const userId = parseId(req.session?.userId);
  const researchThread = Boolean(participantCode && isResearchModeEnabled());

  if (!listingId || (!researchThread && !userId)) {
    return res.status(400).json({ error: 'listing_id and participant_code or sign-in are required' });
  }

  try {
    const result = researchThread
      ? await pool.query(
        `SELECT id, listing_id, seller_id, buyer_id, buyer_email, participant_code, sender_role, body, created_at
         FROM messages
         WHERE listing_id = $1
           AND participant_code = $2
         ORDER BY created_at ASC`,
        [listingId, participantCode]
      )
      : await pool.query(
        `SELECT id, listing_id, seller_id, buyer_id, buyer_email, participant_code, sender_role, body, created_at
         FROM messages
         WHERE listing_id = $1
           AND (buyer_id = $2 OR seller_id = $2)
         ORDER BY created_at ASC`,
        [listingId, userId]
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
  const buyerId = parseId(req.session?.userId);
  const researchMessage = Boolean(participantCode && isResearchModeEnabled());
  const buyerEmail = normalizeText(req.body?.buyer_email);
  const body = normalizeBody(req.body?.body);

  if (!buyerId && !researchMessage) {
    return res.status(401).json({ error: 'Sign in before messaging a seller' });
  }

  if (!listingId || !body || (!researchMessage && !buyerId)) {
    return res.status(400).json({ error: 'listing_id, body, and participant_code or sign-in are required' });
  }

  try {
    const listing = await pool.query(
      'SELECT user_id FROM listings WHERE id = $1 AND status = $2',
      [listingId, 'active']
    );

    if (listing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (buyerId === listing.rows[0].user_id && !researchMessage) {
      return res.status(400).json({ error: 'Sellers cannot message their own listing as a buyer' });
    }

    const buyer = buyerId
      ? await pool.query(
        'SELECT email FROM users WHERE id = $1',
        [buyerId]
      )
      : { rows: [] };

    const result = await pool.query(
      `INSERT INTO messages (listing_id, seller_id, buyer_id, buyer_email, participant_code, sender_role, body)
       VALUES ($1, $2, $3, $4, $5, 'participant', $6)
       RETURNING id, listing_id, seller_id, buyer_id, buyer_email, participant_code, sender_role, body, created_at`,
      [
        listingId,
        listing.rows[0].user_id,
        buyerId,
        buyer.rows[0]?.email || (researchMessage ? buyerEmail : null),
        researchMessage ? participantCode : null,
        body,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
