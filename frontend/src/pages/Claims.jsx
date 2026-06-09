import React, { useEffect, useState } from 'react';
import { getClaims, createClaim, updateClaimStatus, getSessions } from '../services/api';

const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function Claims() {
  const [claims, setClaims] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  
  const [formData, setFormData] = useState({
    session_id: '', claim_no: '', submitted_date: new Date().toISOString().split('T')[0], claimed_amount: '', insurer: '', notes: ''
  });
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const claimsRes = await getClaims(filterStatus ? { status: filterStatus } : {});
      setClaims(claimsRes.data.data);
      const sessRes = await getSessions();
      // Only show sessions that haven't been claimed yet
      setSessions(sessRes.data.data.filter(s => !s.claim_id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createClaim(formData);
      setShowModal(false);
      setFormData({ session_id: '', claim_no: '', submitted_date: new Date().toISOString().split('T')[0], claimed_amount: '', insurer: '', notes: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit claim');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateClaimStatus(id, newStatus);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error updating status');
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insurance Claims</h1>
          <p className="page-subtitle">Submit and track insurance claims</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Submit Claim
        </button>
      </div>

      <div className="card">
        <div className="search-filter-bar">
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Settled">Settled</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner"></div></div>
        ) : claims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No claims found</div>
            <div className="empty-state-desc">Submit a new insurance claim.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Claim Details</th>
                  <th>Patient & Session</th>
                  <th className="text-right">Claimed Amt</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="font-bold">{c.claim_no}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>Submitted: {new Date(c.submitted_date).toLocaleDateString()}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{c.insurer || c.patient_insurer}</div>
                    </td>
                    <td>
                      <div className="font-bold">{c.patient_name}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>Session: {new Date(c.session_date).toLocaleDateString()}</div>
                    </td>
                    <td className="text-right amount">{fmt(c.claimed_amount)}</td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                    </td>
                    <td>
                      {c.status === 'Pending' && (
                        <select 
                          className="btn btn-sm btn-ghost" 
                          style={{ padding: '4px', width: 'auto' }}
                          onChange={(e) => {
                            if(e.target.value) handleStatusChange(c.id, e.target.value);
                          }}
                          value=""
                        >
                          <option value="" disabled>Update Status...</option>
                          <option value="Approved">Mark Approved</option>
                          <option value="Rejected">Mark Rejected</option>
                        </select>
                      )}
                      {c.status === 'Approved' && (
                        <span className="text-muted" style={{ fontSize: '11px' }}>Awaiting Settlement</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Submit Insurance Claim</div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-text mb-4" style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>{error}</div>}
                
                <div className="form-group form-full">
                  <label>Select Unclaimed Session <span className="required">*</span></label>
                  <select 
                    required 
                    value={formData.session_id} 
                    onChange={e => {
                      const selId = e.target.value;
                      const session = sessions.find(s => s.id == selId);
                      setFormData({
                        ...formData, 
                        session_id: selId,
                        claimed_amount: session ? session.fee : '',
                        insurer: session ? session.insurer : ''
                      });
                    }}
                  >
                    <option value="">Select Session...</option>
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {new Date(s.session_date).toLocaleDateString()} - {s.patient_name} (Fee: {fmt(s.fee)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Claim Number <span className="required">*</span></label>
                    <input required type="text" value={formData.claim_no} onChange={e => setFormData({...formData, claim_no: e.target.value})} placeholder="e.g. CLM-2026-X" />
                  </div>
                  <div className="form-group">
                    <label>Submission Date <span className="required">*</span></label>
                    <input required type="date" value={formData.submitted_date} onChange={e => setFormData({...formData, submitted_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Claimed Amount (₹) <span className="required">*</span></label>
                    <input required type="number" step="0.01" min="0" value={formData.claimed_amount} onChange={e => setFormData({...formData, claimed_amount: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Insurer</label>
                    <input type="text" value={formData.insurer} onChange={e => setFormData({...formData, insurer: e.target.value})} />
                  </div>
                </div>
                <div className="form-group form-full mt-4">
                  <label>Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any additional information..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
