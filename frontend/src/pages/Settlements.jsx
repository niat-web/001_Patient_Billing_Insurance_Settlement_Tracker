import React, { useEffect, useState } from 'react';
import { getSettlements, createSettlement, getClaims } from '../services/api';

const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function Settlements() {
  const [settlements, setSettlements] = useState([]);
  const [approvedClaims, setApprovedClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    claim_id: '', settled_amount: '', settlement_date: new Date().toISOString().split('T')[0], shortfall_reason: ''
  });
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const settRes = await getSettlements();
      setSettlements(settRes.data.data);
      // Only get Approved claims for new settlements
      const claimsRes = await getClaims({ status: 'Approved' });
      setApprovedClaims(claimsRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleClaimSelect = (e) => {
    const cid = e.target.value;
    const claim = approvedClaims.find(c => c.id == cid);
    setSelectedClaim(claim);
    setFormData({
      ...formData,
      claim_id: cid,
      settled_amount: claim ? claim.claimed_amount : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createSettlement(formData);
      setShowModal(false);
      setFormData({ claim_id: '', settled_amount: '', settlement_date: new Date().toISOString().split('T')[0], shortfall_reason: '' });
      setSelectedClaim(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record settlement');
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settlements</h1>
          <p className="page-subtitle">Record insurance payments and calculate co-pays</p>
        </div>
        <button className="btn btn-success" onClick={() => setShowModal(true)}>
          + Record Settlement
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-wrapper"><div className="spinner"></div></div>
        ) : settlements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-title">No settlements recorded</div>
            <div className="empty-state-desc">Record an insurance payment to calculate co-pays.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Settlement Date</th>
                  <th>Claim Details</th>
                  <th>Patient</th>
                  <th className="text-right">Session Fee</th>
                  <th className="text-right">Settled Amount</th>
                  <th className="text-right">Co-Pay Balance</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.settlement_date).toLocaleDateString()}</td>
                    <td>
                      <div className="font-bold">{s.claim_no}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{s.insurer}</div>
                    </td>
                    <td>{s.patient_name}</td>
                    <td className="text-right">{fmt(s.session_fee)}</td>
                    <td className="text-right amount amount-positive">{fmt(s.settled_amount)}</td>
                    <td className="text-right">
                      {parseFloat(s.balance_due) > 0 ? (
                        <span className="amount amount-danger">{fmt(s.balance_due)}</span>
                      ) : (
                        <span className="badge badge-paid">Fully Paid</span>
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
              <div className="modal-title">Record Insurance Settlement</div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-text mb-4" style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>{error}</div>}
                
                <div className="form-group form-full">
                  <label>Select Approved Claim <span className="required">*</span></label>
                  <select required value={formData.claim_id} onChange={handleClaimSelect}>
                    <option value="">Select Claim...</option>
                    {approvedClaims.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.claim_no} - {c.patient_name} (Fee: {fmt(c.session_fee)})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClaim && (
                  <div className="copay-highlight mb-4" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Session Fee</div>
                      <div className="font-bold" style={{ fontSize: '16px' }}>{fmt(selectedClaim.session_fee)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Claimed Amount</div>
                      <div className="font-bold">{fmt(selectedClaim.claimed_amount)}</div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expected Co-Pay if Fully Settled</div>
                      <div className="font-bold text-success">
                        {fmt(Math.max(0, selectedClaim.session_fee - selectedClaim.claimed_amount))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label>Settlement Date <span className="required">*</span></label>
                    <input required type="date" value={formData.settlement_date} onChange={e => setFormData({...formData, settlement_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Settled Amount (₹) <span className="required">*</span></label>
                    <input required type="number" step="0.01" min="0" value={formData.settled_amount} onChange={e => setFormData({...formData, settled_amount: e.target.value})} />
                  </div>
                </div>
                
                {selectedClaim && formData.settled_amount !== '' && (
                  <div className={`copay-highlight mb-4 ${selectedClaim.session_fee - formData.settled_amount <= 0 ? 'paid' : ''}`}>
                    <div className="font-bold">Calculated Patient Co-Pay:</div>
                    <div className="amount" style={{ fontSize: '18px' }}>
                      {fmt(Math.max(0, selectedClaim.session_fee - formData.settled_amount))}
                    </div>
                  </div>
                )}

                <div className="form-group form-full mt-4">
                  <label>Shortfall Reason (if any)</label>
                  <textarea value={formData.shortfall_reason} onChange={e => setFormData({...formData, shortfall_reason: e.target.value})} placeholder="Reason for partial payment..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Record Settlement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
