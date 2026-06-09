const router = require('express').Router();
const db = require('../db');

// POST /api/settlements - Record insurance payment and calculate co-pay balance
// Core business logic: balance_due = session_fee - insurance_settled_amount
router.post('/', async (req, res) => {
  const { claim_id, settled_amount, settlement_date, shortfall_reason } = req.body;

  if (!claim_id) return res.status(400).json({ success: false, message: 'Claim ID is required' });
  if (settled_amount === undefined || settled_amount === null) return res.status(400).json({ success: false, message: 'Settled amount is required' });
  if (parseFloat(settled_amount) < 0) return res.status(400).json({ success: false, message: 'Settled amount cannot be negative' });
  if (!settlement_date) return res.status(400).json({ success: false, message: 'Settlement date is required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch claim with session fee
    const [[claim]] = await conn.execute(
      `SELECT ic.id, ic.session_id, ic.claimed_amount, s.fee session_fee, s.patient_id
       FROM insurance_claims ic
       JOIN sessions s ON s.id = ic.session_id
       WHERE ic.id = ?`,
      [claim_id]
    );
    if (!claim) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    // Check if already settled
    const [existingSettlement] = await conn.execute(
      'SELECT id FROM claim_settlements WHERE claim_id = ?',
      [claim_id]
    );
    if (existingSettlement.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'This claim has already been settled' });
    }

    const sessionFee = parseFloat(claim.session_fee);
    const settledAmt = parseFloat(settled_amount);

    // Core formula: balance_due = session_fee - insurance_settled_amount
    // If settled_amount > session_fee, balance_due = 0 (no patient co-pay needed)
    const balance_due = Math.max(0, sessionFee - settledAmt);

    // Step 1: Record settlement
    await conn.execute(
      `INSERT INTO claim_settlements (claim_id, settled_amount, settlement_date, shortfall_reason)
       VALUES (?, ?, ?, ?)`,
      [claim_id, settledAmt, settlement_date, shortfall_reason || null]
    );

    // Step 2: Calculate and store co-pay balance
    // Check if copay_balance record exists for this session
    const [existingCopay] = await conn.execute(
      'SELECT id FROM copay_balances WHERE session_id = ?',
      [claim.session_id]
    );
    if (existingCopay.length) {
      await conn.execute(
        `UPDATE copay_balances SET settled_amount=?, balance_due=?, claim_id=?, status=?
         WHERE session_id=?`,
        [settledAmt, balance_due, claim_id, balance_due === 0 ? 'Paid' : 'Outstanding', claim.session_id]
      );
    } else {
      await conn.execute(
        `INSERT INTO copay_balances (patient_id, session_id, claim_id, session_fee, settled_amount, balance_due, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [claim.patient_id, claim.session_id, claim_id, sessionFee, settledAmt, balance_due, balance_due === 0 ? 'Paid' : 'Outstanding']
      );
    }

    // Step 3: Update claim status to Settled
    await conn.execute('UPDATE insurance_claims SET status = "Settled" WHERE id = ?', [claim_id]);

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Settlement recorded successfully',
      data: {
        session_fee: sessionFee,
        settled_amount: settledAmt,
        balance_due,
        copay_status: balance_due === 0 ? 'Fully Covered' : 'Outstanding'
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/settlements - Get all settlements
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT cs.*, ic.claim_no, ic.claimed_amount, ic.status claim_status,
              s.fee session_fee, s.session_date, s.session_type,
              p.name patient_name, p.insurer,
              cb.balance_due, cb.status copay_status
       FROM claim_settlements cs
       JOIN insurance_claims ic ON ic.id = cs.claim_id
       JOIN sessions s ON s.id = ic.session_id
       JOIN patients p ON p.id = s.patient_id
       LEFT JOIN copay_balances cb ON cb.claim_id = cs.claim_id
       ORDER BY cs.settlement_date DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
