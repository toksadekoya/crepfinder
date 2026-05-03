import { Router } from 'express';
import pool from '../database/db.js';

const router = Router();

// GET /api/conditions/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT condition_name FROM ab_conditions WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No condition assigned' });
    res.json({ condition: result.rows[0].condition_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch condition' });
  }
});

export default router;
