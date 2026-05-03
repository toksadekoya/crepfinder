import { Router } from 'express';
import { randomInt } from 'node:crypto';
import pool from '../database/db.js';

const router = Router();

function makeParticipantCode() {
  return `P${String(randomInt(1, 1000)).padStart(3, '0')}`;
}

function chooseCondition(assignments) {
  const counts = assignments.reduce((acc, row) => {
    acc[row.condition_name] = Number(row.count);
    return acc;
  }, { A: 0, B: 0 });

  if (counts.A < counts.B) return 'A';
  if (counts.B < counts.A) return 'B';
  return Math.random() < 0.5 ? 'A' : 'B';
}

async function createParticipantCode(client, userAgent) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const code = makeParticipantCode();
    const result = await client.query(
      `INSERT INTO participant_codes (participant_code, user_agent)
       VALUES ($1, $2)
       ON CONFLICT (participant_code) DO NOTHING
       RETURNING participant_code, consented_at`,
      [code, userAgent]
    );

    if (result.rows.length) {
      return result.rows[0];
    }
  }

  throw new Error('Unable to generate unique participant code');
}

router.post('/consent', async (req, res) => {
  if (req.body?.consented !== true) {
    return res.status(400).json({ error: 'Consent confirmation is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const participant = await createParticipantCode(client, req.get('user-agent') ?? null);
    const assignmentCounts = await client.query(`
      SELECT condition_name, COUNT(*)::int
      FROM condition_assignments
      GROUP BY condition_name
    `);
    const condition = chooseCondition(assignmentCounts.rows);

    const assignment = await client.query(
      `INSERT INTO condition_assignments (participant_code, condition_name)
       VALUES ($1, $2)
       RETURNING condition_name, assigned_at`,
      [participant.participant_code, condition]
    );

    await client.query('COMMIT');

    res.status(201).json({
      participant_code: participant.participant_code,
      condition_name: assignment.rows[0].condition_name,
      consented_at: participant.consented_at,
      assigned_at: assignment.rows[0].assigned_at,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create study session' });
  } finally {
    client.release();
  }
});

export default router;
