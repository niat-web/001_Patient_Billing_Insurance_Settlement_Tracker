const router = require('express').Router();
const db = require('../db');

// GET /api/dashboard/summary - Main dashboard statistics
router.get('/summary', async (req, res) => {
  try {
    // Total sessions and billing
    const [[totals]] = await db.execute(`
      SELECT
        COUNT(DISTINCT s.id) AS total_sessions,
        COALESCE(SUM(s.fee), 0) AS total_billed,
        COUNT(DISTINCT CASE WHEN ic.status = 'Pending' THEN ic.id END) AS pending_claims_count,
        COALESCE(SUM(CASE WHEN ic.status = 'Pending' THEN ic.claimed_amount ELSE 0 END), 0) AS insurance_pending,
        COALESCE(SUM(CASE WHEN ic.status = 'Settled' THEN cs.settled_amount ELSE 0 END), 0) AS insurance_settled,
        COALESCE(SUM(CASE WHEN cb.status = 'Outstanding' THEN cb.balance_due ELSE 0 END), 0) AS total_copay_outstanding,
        COUNT(DISTINCT CASE WHEN ic.status = 'Rejected' THEN ic.id END) AS rejected_claims_count,
        COUNT(DISTINCT CASE WHEN ic.status = 'Settled' THEN ic.id END) AS settled_claims_count
      FROM sessions s
      LEFT JOIN insurance_claims ic ON ic.session_id = s.id
      LEFT JOIN claim_settlements cs ON cs.claim_id = ic.id
      LEFT JOIN copay_balances cb ON cb.session_id = s.id
    `);

    // Claims by status for pie chart
    const [claimsByStatus] = await db.execute(`
      SELECT status, COUNT(*) AS count, COALESCE(SUM(claimed_amount), 0) AS amount
      FROM insurance_claims
      GROUP BY status
    `);

    // Monthly billing trend for bar chart (last 6 months)
    const [monthlyTrend] = await db.execute(`
      SELECT
        DATE_FORMAT(s.session_date, '%Y-%m') AS month,
        DATE_FORMAT(s.session_date, '%b %Y') AS month_label,
        COALESCE(SUM(s.fee), 0) AS total_billed,
        COALESCE(SUM(CASE WHEN ic.status = 'Settled' THEN cs.settled_amount ELSE 0 END), 0) AS total_settled,
        COALESCE(SUM(CASE WHEN cb.status = 'Outstanding' THEN cb.balance_due ELSE 0 END), 0) AS total_outstanding
      FROM sessions s
      LEFT JOIN insurance_claims ic ON ic.session_id = s.id
      LEFT JOIN claim_settlements cs ON cs.claim_id = ic.id
      LEFT JOIN copay_balances cb ON cb.session_id = s.id
      WHERE s.session_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(s.session_date, '%Y-%m'), DATE_FORMAT(s.session_date, '%b %Y')
      ORDER BY month ASC
    `);

    // Physiotherapist session count
    const [physiotherapistStats] = await db.execute(`
      SELECT
        physiotherapist,
        COUNT(*) AS session_count,
        COALESCE(SUM(fee), 0) AS total_billed
      FROM sessions
      WHERE physiotherapist IS NOT NULL
      GROUP BY physiotherapist
      ORDER BY session_count DESC
      LIMIT 10
    `);

    // Outstanding co-pay patients
    const [outstandingCopay] = await db.execute(`
      SELECT p.id, p.name, p.phone, p.insurer,
             COALESCE(SUM(cb.balance_due), 0) AS total_outstanding,
             COUNT(cb.id) AS sessions_with_balance
      FROM patients p
      JOIN copay_balances cb ON cb.patient_id = p.id
      WHERE cb.status = 'Outstanding' AND cb.balance_due > 0
      GROUP BY p.id, p.name, p.phone, p.insurer
      ORDER BY total_outstanding DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        totals,
        claimsByStatus,
        monthlyTrend,
        physiotherapistStats,
        outstandingCopay
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/copay-balances - All outstanding patient co-pays
router.get('/copay-balances', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT cb.*, p.name patient_name, p.phone, p.insurer, p.policy_no,
             s.session_date, s.session_type, s.physiotherapist, s.fee,
             ic.claim_no, ic.status claim_status
      FROM copay_balances cb
      JOIN patients p ON p.id = cb.patient_id
      JOIN sessions s ON s.id = cb.session_id
      LEFT JOIN insurance_claims ic ON ic.id = cb.claim_id
      WHERE cb.status = 'Outstanding' AND cb.balance_due > 0
      ORDER BY cb.balance_due DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
