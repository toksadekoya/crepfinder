import { Router } from 'express';
import pool from '../database/db.js';

const router = Router();

function escapeCsv(value) {
  if (value == null) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function requireExportToken(req, res, next) {
  const configuredToken = process.env.RESEARCH_EXPORT_TOKEN;

  if (!configuredToken && process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  if (configuredToken && req.query.token === configuredToken) {
    next();
    return;
  }

  res.status(401).json({ error: 'Export token required' });
}

router.get('/export.csv', requireExportToken, async (req, res) => {
  const includePilot = req.query.include_pilot === 'true';

  try {
    const result = await pool.query(`
      SELECT
        pc.participant_code,
        COALESCE(pc.is_pilot, tm.is_pilot, FALSE) AS is_pilot,
        ca.condition_name AS assigned_condition,
        pc.consented_at,
        ca.assigned_at,
        tm.id AS trust_measurement_id,
        tm.listing_id,
        l.brand,
        l.model,
        tm.created_at AS trust_submitted_at,
        tm.q1_competence_knowledgeable AS q1,
        tm.q2_competence_capable AS q2,
        tm.q3_benevolence_best_interest AS q3,
        tm.q4_benevolence_cares AS q4,
        tm.q5_integrity_honest AS q5,
        tm.q6_intention_comfortable AS q6,
        tm.q7_intention_proceed AS q7
      FROM participant_codes pc
      LEFT JOIN condition_assignments ca
        ON ca.participant_code = pc.participant_code
      LEFT JOIN trust_measurements tm
        ON tm.participant_id = pc.participant_code
      LEFT JOIN listings l
        ON l.id = tm.listing_id
      WHERE $1::boolean = TRUE
        OR COALESCE(pc.is_pilot, tm.is_pilot, FALSE) = FALSE
      ORDER BY pc.consented_at ASC, tm.created_at ASC
    `, [includePilot]);

    const headers = [
      'participant_code',
      'is_pilot',
      'assigned_condition',
      'consented_at',
      'assigned_at',
      'trust_measurement_id',
      'listing_id',
      'brand',
      'model',
      'trust_submitted_at',
      'q1',
      'q2',
      'q3',
      'q4',
      'q5',
      'q6',
      'q7',
    ];
    const csv = [
      headers.join(','),
      ...result.rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="crepfinder-study-export.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export research data' });
  }
});

export default router;
