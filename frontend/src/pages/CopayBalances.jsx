import React, { useEffect, useState } from 'react';
import { getCopayBalances } from '../services/api';
import { Link } from 'react-router-dom';

const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function CopayBalances() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCopayBalances()
      .then(r => setBalances(r.data.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const totalOutstanding = balances.reduce((sum, b) => sum + parseFloat(b.balance_due || 0), 0);

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title text-danger">⚠️ Co-Pay Balances</h1>
          <p className="page-subtitle">All outstanding patient balances to be collected</p>
        </div>
        <div className="text-right">
          <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Total Outstanding</div>
          <div className="amount amount-danger" style={{ fontSize: '24px' }}>{fmt(totalOutstanding)}</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-wrapper"><div className="spinner"></div></div>
        ) : balances.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-title">All Co-Pays Collected!</div>
            <div className="empty-state-desc">There are no outstanding patient balances.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Session Details</th>
                  <th>Insurance Info</th>
                  <th className="text-right">Session Fee</th>
                  <th className="text-right">Insurance Paid</th>
                  <th className="text-right text-danger">Balance Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {balances.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div className="font-bold">{b.patient_name}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{b.phone}</div>
                    </td>
                    <td>
                      <div className="font-bold">{new Date(b.session_date).toLocaleDateString()}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{b.session_type}</div>
                    </td>
                    <td>
                      <div>{b.insurer || 'Uninsured'}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{b.claim_no ? `Claim: ${b.claim_no}` : 'No Claim'}</div>
                    </td>
                    <td className="text-right">{fmt(b.fee)}</td>
                    <td className="text-right text-success">{fmt(b.settled_amount)}</td>
                    <td className="text-right font-bold amount-danger">{fmt(b.balance_due)}</td>
                    <td>
                      <Link to={`/ledger/${b.patient_id}`} className="btn btn-sm btn-ghost">View Ledger</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
