import { Router } from 'express';
import pool from '../database/db.js';
import { normalizeParticipantCode } from '../lib/participantCodes.js';
import { isResearchModeEnabled } from '../lib/runtime.js';

const router = Router();
const allowedTransitions = {
  seller: {
    requested: ['accepted', 'cancelled'],
    accepted: ['awaiting_payment', 'shipped', 'cancelled'],
    paid: ['shipped', 'cancelled'],
  },
  buyer: {
    requested: ['cancelled'],
    accepted: ['cancelled'],
    awaiting_payment: ['cancelled'],
    paid: ['disputed'],
    shipped: ['completed', 'disputed'],
  },
};

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeText(value, limit = 500) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, limit) : null;
}

router.post('/', async (req, res) => {
  const listingId = parseId(req.body?.listing_id);
  const participantCode = normalizeParticipantCode(req.body?.participant_code);
  const buyerId = parseId(req.session?.userId);
  const researchRequest = Boolean(participantCode && isResearchModeEnabled());
  const buyerName = normalizeText(req.body?.buyer_name, 120);
  const buyerEmail = normalizeText(req.body?.buyer_email, 160);
  const buyerNote = normalizeText(req.body?.buyer_note, 1000);

  if (!listingId) {
    return res.status(400).json({ error: 'listing_id is required' });
  }

  if (participantCode && !researchRequest) {
    return res.status(400).json({ error: 'Study participant codes are disabled in this deployment' });
  }

  if (!buyerId && !researchRequest) {
    return res.status(401).json({ error: 'Sign in before requesting a purchase' });
  }

  try {
    const listing = await pool.query(
      `SELECT l.id, l.user_id AS seller_id, u.email AS seller_email
       FROM listings l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = $1
         AND l.status = 'active'`,
      [listingId]
    );

    if (listing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (buyerId && buyerId === listing.rows[0].seller_id) {
      return res.status(400).json({ error: 'Sellers cannot request purchase of their own listings' });
    }

    let storedBuyerName = buyerName;
    let storedBuyerEmail = buyerEmail;

    if (buyerId) {
      const buyer = await pool.query(
        'SELECT username, display_name, email FROM users WHERE id = $1',
        [buyerId]
      );

      if (buyer.rows.length === 0) {
        return res.status(401).json({ error: 'Signed-in buyer account was not found' });
      }

      storedBuyerName = buyerName || buyer.rows[0].display_name || buyer.rows[0].username;
      storedBuyerEmail = buyer.rows[0].email;
    }

    const result = researchRequest
      ? await pool.query(
        `INSERT INTO purchase_requests (listing_id, buyer_id, participant_code, buyer_name, buyer_email, buyer_note, status, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW())
         ON CONFLICT (listing_id, participant_code)
         DO UPDATE SET
           status = 'completed',
           buyer_id = COALESCE(purchase_requests.buyer_id, EXCLUDED.buyer_id),
           buyer_name = COALESCE(EXCLUDED.buyer_name, purchase_requests.buyer_name),
           buyer_email = COALESCE(EXCLUDED.buyer_email, purchase_requests.buyer_email),
           buyer_note = COALESCE(EXCLUDED.buyer_note, purchase_requests.buyer_note),
           completed_at = COALESCE(purchase_requests.completed_at, NOW()),
           updated_at = NOW()
         RETURNING id, listing_id, buyer_id, participant_code, buyer_name, buyer_email, buyer_note, status, payment_status, created_at, completed_at`,
        [listingId, buyerId, participantCode, storedBuyerName, storedBuyerEmail, buyerNote]
      )
      : await pool.query(
        `INSERT INTO purchase_requests (listing_id, buyer_id, buyer_name, buyer_email, buyer_note, status)
         VALUES ($1, $2, $3, $4, $5, 'requested')
         RETURNING id, listing_id, buyer_id, participant_code, buyer_name, buyer_email, buyer_note, status, payment_status, created_at, completed_at`,
        [listingId, buyerId, storedBuyerName, storedBuyerEmail, buyerNote]
      );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You already have an open request for this listing' });
    }

    console.error(err);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
});

router.get('/mine', async (req, res) => {
  const userId = parseId(req.session?.userId);

  if (!userId) {
    return res.status(401).json({ error: 'Sign in to view purchase requests' });
  }

  try {
    const result = await pool.query(
      `SELECT pr.*, l.brand, l.model, l.price, l.user_id AS seller_id
       FROM purchase_requests pr
       JOIN listings l ON pr.listing_id = l.id
       WHERE pr.buyer_id = $1
          OR l.user_id = $1
       ORDER BY pr.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch purchase requests' });
  }
});

router.patch('/:id/status', async (req, res) => {
  const userId = parseId(req.session?.userId);
  const requestId = parseId(req.params.id);
  const status = normalizeText(req.body?.status, 30);

  if (!userId) {
    return res.status(401).json({ error: 'Sign in to update purchase requests' });
  }

  if (!requestId || !status) {
    return res.status(400).json({ error: 'Valid request id and status are required' });
  }

  try {
    const existing = await pool.query(
      `SELECT pr.id, pr.status, pr.buyer_id, l.user_id AS seller_id
       FROM purchase_requests pr
       JOIN listings l ON pr.listing_id = l.id
       WHERE pr.id = $1
         AND (l.user_id = $2 OR pr.buyer_id = $2)`,
      [requestId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }

    const purchaseRequest = existing.rows[0];
    const role = purchaseRequest.seller_id === userId ? 'seller' : 'buyer';
    const permittedStatuses = allowedTransitions[role][purchaseRequest.status] || [];

    if (!permittedStatuses.includes(status)) {
      return res.status(409).json({
        error: `${role === 'seller' ? 'Seller' : 'Buyer'} cannot move this request from ${purchaseRequest.status} to ${status}`,
        allowed_statuses: permittedStatuses,
      });
    }

    const result = await pool.query(
      `UPDATE purchase_requests
       SET status = $1,
           completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
           updated_at = NOW()
       WHERE id = $2
         AND status = $3
       RETURNING id, listing_id, buyer_id, participant_code, buyer_name, buyer_email, buyer_note, status, payment_status, created_at, completed_at`,
      [status, requestId, purchaseRequest.status]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Purchase request changed; refresh and try again' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update purchase request' });
  }
});

router.get('/eligibility', async (req, res) => {
  const listingId = parseId(req.query.listing_id);
  const participantCode = normalizeParticipantCode(req.query.participant_code);
  const buyerId = parseId(req.session?.userId);
  const researchRequest = Boolean(participantCode && isResearchModeEnabled());

  if (!listingId || (!researchRequest && !buyerId)) {
    return res.status(400).json({ error: 'listing_id and participant_code or sign-in are required' });
  }

  try {
    const result = researchRequest
      ? await pool.query(
        `SELECT id, status, completed_at
         FROM purchase_requests
         WHERE listing_id = $1
           AND participant_code = $2
           AND status = 'completed'`,
        [listingId, participantCode]
      )
      : await pool.query(
        `SELECT id, status, completed_at
         FROM purchase_requests
         WHERE listing_id = $1
           AND buyer_id = $2
           AND status = 'completed'`,
        [listingId, buyerId]
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
