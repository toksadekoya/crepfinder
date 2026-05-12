import { Router } from 'express';
import { randomInt } from 'node:crypto';
import pool from '../database/db.js';
import { isPilotParticipantCode, normalizeParticipantCode } from '../lib/participantCodes.js';

const router = Router();

function makeParticipantCode(isPilot = false) {
  const suffix = String(randomInt(1, 1000)).padStart(3, '0');
  return isPilot ? `PILOT_${suffix}` : `P${suffix}`;
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

async function createParticipantCode(client, userAgent, { requestedCode = null, isPilot = false } = {}) {
  if (requestedCode) {
    const result = await client.query(
      `INSERT INTO participant_codes (participant_code, user_agent, is_pilot)
       VALUES ($1, $2, $3)
       ON CONFLICT (participant_code)
       DO UPDATE SET
         user_agent = COALESCE(participant_codes.user_agent, EXCLUDED.user_agent),
         is_pilot = participant_codes.is_pilot OR EXCLUDED.is_pilot
       RETURNING participant_code, is_pilot, consented_at`,
      [requestedCode, userAgent, isPilotParticipantCode(requestedCode)]
    );

    return result.rows[0];
  }

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const code = makeParticipantCode(isPilot);
    const result = await client.query(
      `INSERT INTO participant_codes (participant_code, user_agent, is_pilot)
       VALUES ($1, $2, $3)
       ON CONFLICT (participant_code) DO NOTHING
       RETURNING participant_code, is_pilot, consented_at`,
      [code, userAgent, isPilot]
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

  const requestedCode = req.body?.participant_code == null
    ? null
    : normalizeParticipantCode(req.body.participant_code);

  if (req.body?.participant_code != null && !requestedCode) {
    return res.status(400).json({ error: 'Invalid participant code' });
  }

  const isPilot = req.body?.pilot === true || isPilotParticipantCode(requestedCode);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const participant = await createParticipantCode(client, req.get('user-agent') ?? null, {
      requestedCode,
      isPilot,
    });
    const assignmentCounts = await client.query(`
      SELECT condition_name, COUNT(*)::int
      FROM condition_assignments
      GROUP BY condition_name
    `);
    const condition = chooseCondition(assignmentCounts.rows);

    const assignment = await client.query(
      `INSERT INTO condition_assignments (participant_code, condition_name)
       VALUES ($1, $2)
       ON CONFLICT (participant_code)
       DO UPDATE SET condition_name = condition_assignments.condition_name
       RETURNING condition_name, assigned_at`,
      [participant.participant_code, condition]
    );

    await client.query('COMMIT');

    res.status(201).json({
      participant_code: participant.participant_code,
      is_pilot: participant.is_pilot,
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
