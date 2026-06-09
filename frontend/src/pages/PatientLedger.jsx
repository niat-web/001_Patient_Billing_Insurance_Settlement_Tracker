import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatient } from '../services/api';

const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function PatientLedger() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPatient(id)
      .then(r => setPatient(r.data.data))
      .catch(e => setError('Patient not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <div className="page-wrapper">
        <div className="empty-state">
          <div className="empty-state-icon">🔎</div>
          <div className="empty-state-title">Select a Patient</div>
          <div className="empty-state-desc">Go to the Patients page and select a ledger to view.</div>
          <Link to="/patients" className="btn btn-primary mt-4">Go to Patients</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="page-wrapper"><div className="loading-wrapper"><div className="spinner"></div></div></div>;
  if (error) return <div className="page-wrapper"><div className="empty-state"><div className="empty-state-title">{error}</div></div></div>;

  const totalBilled = patient.sessions.reduce((sum, s) => sum + parseFloat(s.fee || 0), 0);
  const totalSettled = patient.sessions.reduce((sum, s) => sum + parseFloat(s.settled_amount || 0), 0);
  const totalOutstanding = patient.sessions.reduce((sum, s) => sum + parseFloat(s.balance_due || 0), 0);

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{patient.name}'s Ledger</h1>
          <p className="page-subtitle">Complete financial history and sessions</p>
        </div>
        <Link to="/patients" className="btn btn-ghost">← Back</Link>
      </div>

      <div className="card mb-4">
        <div className="card-title">👤 Patient Profile</div>
        <div className="form-grid-3">
          <div>
            <div className="text-muted" style={{ fontSize: '11px' }}>Contact</div>
            <div className="font-bold">{patient.phone || 'N/A'}</div>
            <div style={{ fontSize: '12px' }}>{patient.email || 'N/A'}</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '11px' }}>Insurance Provider</div>
            <div className="font-bold">{patient.insurer || 'Uninsured'}</div>
            <div style={{ fontSize: '12px' }}>Policy: {patient.policy_no || 'N/A'}</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '11px' }}>Pre-Authorisation</div>
            <div className="font-bold">{patient.preauth_code || 'N/A'}</div>
            <div style={{ fontSize: '12px' }}>Approved Sessions: {patient.approved_sessions}</div>
          </div>
        </div>
      </div>

      <div className="stat-grid mb-4">
        <div className="stat-card primary">
          <div className="stat-label">Total Billed</div>
          <div className="stat-value">{fmt(totalBilled)}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Insurance Paid</div>
          <div className="stat-value">{fmt(totalSettled)}</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Co-Pay Outstanding</div>
          <div className="stat-value">{fmt(totalOutstanding)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">🏥 Session History</div>
        {patient.sessions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-desc">No sessions recorded yet.</div></div>
        ) : (
          <div>
            {patient.sessions.map((s, idx) => (
              <div key={s.id} className="ledger-session">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <div className="font-bold">Session #{patient.sessions.length - idx} • {new Date(s.session_date).toLocaleDateString()}</div>
                  <span className={`badge badge-${s.session_type.toLowerCase()}`}>{s.session_type}</span>
                </div>
                
                <div className="ledger-row">
                  <div className="ledger-field">
                    <label>Physiotherapist</label>
                    <div className="value">Dr. {s.physiotherapist || 'N/A'}</div>
                  </div>
                  <div className="ledger-field">
                    <label>Session Fee</label>
                    <div className="value">{fmt(s.fee)}</div>
                  </div>
                  <div className="ledger-field">
                    <label>Claim Status</label>
                    <div className="value">
                      {s.claim_no ? (
                        <span className={`text-${s.claim_status === 'Settled' ? 'success' : s.claim_status === 'Rejected' ? 'danger' : 'warning'}`}>
                          {s.claim_status} ({s.claim_no})
                        </span>
                      ) : 'Unclaimed'}
                    </div>
                  </div>
                </div>

                {(s.claim_status === 'Settled' || s.claim_status === 'Rejected') && (
                  <div className={`copay-highlight ${s.balance_due <= 0 ? 'paid' : ''}`}>
                    <div>
                      <span className="text-muted" style={{ fontSize: '11px', marginRight: '8px' }}>Settled Amount:</span>
                      <span className="font-bold">{fmt(s.settled_amount)}</span>
                    </div>
                    <div>
                      <span className="text-muted" style={{ fontSize: '11px', marginRight: '8px' }}>Co-Pay Due:</span>
                      <span className="font-bold">{fmt(s.balance_due)}</span>
                      {s.balance_due <= 0 && <span style={{ marginLeft: '8px' }}>✅</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
