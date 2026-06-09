const router = require('express').Router();
const db = require('../db');

// POST /api/claims - Submit a new insurance claim
router.post('/', async (req, res) => {
  const { session_id, claim_no, submitted_date, claimed_amount, insurer, notes } = req.body;

  if (!session_id) return res.status(400).json({ success: false, message: 'Session ID is required' });
  if (!claim_no || claim_no.trim() === '') return res.status(400).json({ success: false, message: 'Claim number is required' });
  if (!submitted_date) return res.status(400).json({ success: false, message: 'Submission date is required' });
  if (!claimed_amount || parseFloat(claimed_amount) <= 0) return res.status(400).json({ success: false, message: 'Valid claimed amount is required' });

  try {
    // Check session exists
    const [sessions] = await db.execute('SELECT id FROM sessions WHERE id = ?', [session_id]);
    if (!sessions.length) return res.status(404).json({ success: false, message: 'Session not found' });

    // Check for duplicate claim number
    const [existing] = await db.execute('SELECT id FROM insurance_claims WHERE claim_no = ?', [claim_no.trim()]);
    if (existing.length) return res.status(400).json({ success: false, message: 'Claim number already exists' });

    const [result] = await db.execute(
      `INSERT INTO insurance_claims (session_id, claim_no, submitted_date, claimed_amount, insurer, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session_id, claim_no.trim(), submitted_date, parseFloat(claimed_amount), insurer || null, notes || null]
    );
    res.status(201).json({ success: true, message: 'Insurance claim submitted successfully', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/claims - Get all claims with session and patient info
router.get('/', async (req, res) => {
  try {
    const { status, patient_id } = req.query;
    let query = `
      SELECT ic.*, s.fee session_fee, s.session_date, s.session_type, s.physiotherapist,
             p.id patient_id, p.name patient_name, p.insurer patient_insurer,
             cs.settled_amount, cs.settlement_date, cs.shortfall_reason,
             cb.balance_due
      FROM insurance_claims ic
      JOIN sessions s ON s.id = ic.session_id
      JOIN patients p ON p.id = s.patient_id
      LEFT JOIN claim_settlements cs ON cs.claim_id = ic.id
      LEFT JOIN copay_balances cb ON cb.session_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { query += ' AND ic.status = ?'; params.push(status); }
    if (patient_id) { query += ' AND p.id = ?'; params.push(patient_id); }
    query += ' ORDER BY ic.submitted_date DESC';

    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/claims/:id/status - Update claim status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Approved', 'Rejected', 'Settled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute('UPDATE insurance_claims SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (status === 'Rejected') {
      // If rejected, settled amount is 0 and the full session fee becomes the patient's balance_due
      const [[claim]] = await conn.execute(
        `SELECT ic.session_id, s.fee session_fee, s.patient_id
         FROM insurance_claims ic
         JOIN sessions s ON s.id = ic.session_id
         WHERE ic.id = ?`,
        [req.params.id]
      );

      if (claim) {
        const sessionFee = parseFloat(claim.session_fee);
        const settledAmt = 0;
        const balance_due = sessionFee;
        
        // Record a $0 settlement to explicitly mark the rejection settlement
        await conn.execute(
          `INSERT INTO claim_settlements (claim_id, settled_amount, settlement_date, shortfall_reason)
           VALUES (?, ?, CURDATE(), ?)`,
          [req.params.id, settledAmt, 'Claim Rejected']
        );

        // Calculate and store co-pay balance
        const [existingCopay] = await conn.execute(
          'SELECT id FROM copay_balances WHERE session_id = ?',
          [claim.session_id]
        );
        
        if (existingCopay.length) {
          await conn.execute(
            `UPDATE copay_balances SET settled_amount=?, balance_due=?, claim_id=?, status='Outstanding'
             WHERE session_id=?`,
            [settledAmt, balance_due, req.params.id, claim.session_id]
          );
        } else {
          await conn.execute(
            `INSERT INTO copay_balances (patient_id, session_id, claim_id, session_fee, settled_amount, balance_due, status)
             VALUES (?, ?, ?, ?, ?, ?, 'Outstanding')`,
            [claim.patient_id, claim.session_id, req.params.id, sessionFee, settledAmt, balance_due]
          );
        }
      }
    }

    await conn.commit();
    res.json({ success: true, message: 'Claim status updated' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
