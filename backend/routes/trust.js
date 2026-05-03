import { Router } from 'express';
import pool from '../database/db.js';

const router = Router();

// POST /api/trust
router.post('/', async (req, res) => {
  const {
    listing_id,
    condition_name,
    participant_id,
    q1, q2, q3, q4, q5, q6, q7,
  } = req.body;

  if (!listing_id || !condition_name || [q1, q2, q3, q4, q5, q6, q7].some(v => v == null)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO trust_measurements
        (listing_id, condition_name, participant_id,
         q1_competence_knowledgeable, q2_competence_capable,
         q3_benevolence_best_interest, q4_benevolence_cares,
         q5_integrity_honest,
         q6_intention_comfortable, q7_intention_proceed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [listing_id, condition_name, participant_id ?? null, q1, q2, q3, q4, q5, q6, q7]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save trust measurement' });
  }
});

export default router;
