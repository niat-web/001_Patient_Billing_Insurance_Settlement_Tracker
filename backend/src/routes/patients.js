const router = require('express').Router();
const db = require('../db');

// POST /api/patients - Register a new patient
router.post('/', async (req, res) => {
  const { name, phone, email, date_of_birth, insurer, policy_no, preauth_code, approved_sessions } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Patient name is required' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO patients (name, phone, email, date_of_birth, insurer, policy_no, preauth_code, approved_sessions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), phone || null, email || null, date_of_birth || null, insurer || null, policy_no || null, preauth_code || null, approved_sessions || 0]
    );
    res.status(201).json({ success: true, message: 'Patient registered successfully', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/patients - Get all patients
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM patients';
    const params = [];
    if (search) {
      query += ' WHERE name LIKE ? OR policy_no LIKE ? OR insurer LIKE ?';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/patients/:id - Get single patient with all sessions, claims, settlements
router.get('/:id', async (req, res) => {
  try {
    const [patients] = await db.execute('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!patients.length) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const [sessions] = await db.execute(
      `SELECT
         s.*,
         ic.id claim_id,
         ic.claim_no,
         ic.submitted_date,
         ic.claimed_amount,
         ic.status claim_status,
         ic.insurer claim_insurer,
         cs.settled_amount,
         cs.settlement_date,
         cs.shortfall_reason,
         cb.balance_due,
         cb.status copay_status
       FROM sessions s
       LEFT JOIN insurance_claims ic ON ic.session_id = s.id
       LEFT JOIN claim_settlements cs ON cs.claim_id = ic.id
       LEFT JOIN copay_balances cb ON cb.session_id = s.id
       WHERE s.patient_id = ?
       ORDER BY s.session_date DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...patients[0], sessions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/patients/:id - Update patient
router.put('/:id', async (req, res) => {
  const { name, phone, email, date_of_birth, insurer, policy_no, preauth_code, approved_sessions } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Patient name is required' });
  }
  try {
    const [result] = await db.execute(
      `UPDATE patients SET name=?, phone=?, email=?, date_of_birth=?, insurer=?, policy_no=?, preauth_code=?, approved_sessions=? WHERE id=?`,
      [name.trim(), phone || null, email || null, date_of_birth || null, insurer || null, policy_no || null, preauth_code || null, approved_sessions || 0, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, message: 'Patient updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM patients WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
