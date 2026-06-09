const router = require('express').Router();
const db = require('../db');

// POST /api/sessions - Record a new physiotherapy session
router.post('/', async (req, res) => {
  const { patient_id, session_date, physiotherapist, session_type, duration_mins, fee, notes } = req.body;

  if (!patient_id) return res.status(400).json({ success: false, message: 'Patient ID is required' });
  if (!session_date) return res.status(400).json({ success: false, message: 'Session date is required' });
  if (!fee || parseFloat(fee) <= 0) return res.status(400).json({ success: false, message: 'Valid session fee is required' });

  try {
    // Check patient exists
    const [patients] = await db.execute('SELECT id FROM patients WHERE id = ?', [patient_id]);
    if (!patients.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const [result] = await db.execute(
      `INSERT INTO sessions (patient_id, session_date, physiotherapist, session_type, duration_mins, fee, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, session_date, physiotherapist || null, session_type || 'Treatment', duration_mins || 60, parseFloat(fee), notes || null]
    );
    res.status(201).json({ success: true, message: 'Session recorded successfully', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sessions - Get all sessions with patient info
router.get('/', async (req, res) => {
  try {
    const { patient_id, session_type } = req.query;
    let query = `
      SELECT s.*, p.name patient_name, p.insurer, p.policy_no,
             ic.id claim_id, ic.claim_no, ic.status claim_status, ic.claimed_amount,
             cs.settled_amount, cb.balance_due
      FROM sessions s
      JOIN patients p ON p.id = s.patient_id
      LEFT JOIN insurance_claims ic ON ic.session_id = s.id
      LEFT JOIN claim_settlements cs ON cs.claim_id = ic.id
      LEFT JOIN copay_balances cb ON cb.session_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (patient_id) { query += ' AND s.patient_id = ?'; params.push(patient_id); }
    if (session_type) { query += ' AND s.session_type = ?'; params.push(session_type); }
    query += ' ORDER BY s.session_date DESC';

    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sessions/:id - Get single session
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, p.name patient_name, p.insurer, p.policy_no, p.preauth_code,
              ic.id claim_id, ic.claim_no, ic.status claim_status, ic.claimed_amount, ic.submitted_date,
              cs.settled_amount, cs.settlement_date, cs.shortfall_reason,
              cb.balance_due, cb.status copay_status
       FROM sessions s
       JOIN patients p ON p.id = s.patient_id
       LEFT JOIN insurance_claims ic ON ic.session_id = s.id
       LEFT JOIN claim_settlements cs ON cs.claim_id = ic.id
       LEFT JOIN copay_balances cb ON cb.session_id = s.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
