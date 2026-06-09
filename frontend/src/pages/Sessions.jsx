import React, { useEffect, useState } from 'react';
import { getSessions, createSession, getPatients } from '../services/api';

const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('');
  
  const [formData, setFormData] = useState({
    patient_id: '', session_date: new Date().toISOString().split('T')[0], physiotherapist: '', session_type: 'Treatment', duration_mins: 60, fee: '', notes: ''
  });
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const sessRes = await getSessions(filterType ? { session_type: filterType } : {});
      setSessions(sessRes.data.data);
      const patRes = await getPatients('');
      setPatients(patRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createSession(formData);
      setShowModal(false);
      setFormData({ ...formData, fee: '', notes: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record session');
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sessions</h1>
          <p className="page-subtitle">Record and view physiotherapy sessions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Record Session
        </button>
      </div>

      <div className="card">
        <div className="search-filter-bar">
          <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Session Types</option>
            <option value="Assessment">Assessment</option>
            <option value="Treatment">Treatment</option>
            <option value="Review">Review</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner"></div></div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏥</div>
            <div className="empty-state-title">No sessions recorded</div>
            <div className="empty-state-desc">Record a patient session to see it here.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Details</th>
                  <th>Fee</th>
                  <th>Claim Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="font-bold">{new Date(s.session_date).toLocaleDateString()}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>ID: {s.id}</div>
                    </td>
                    <td>
                      <div className="font-bold">{s.patient_name}</div>
                      {s.insurer && <div className="text-muted" style={{ fontSize: '11px' }}>{s.insurer}</div>}
                    </td>
                    <td>
                      <span className={`badge badge-${s.session_type.toLowerCase()}`}>{s.session_type}</span>
                      <div className="text-muted mt-4" style={{ fontSize: '11px' }}>Dr. {s.physiotherapist} ({s.duration_mins}m)</div>
                    </td>
                    <td className="amount">{fmt(s.fee)}</td>
                    <td>
                      {s.claim_id ? (
                        <span className={`badge badge-${s.claim_status?.toLowerCase()}`}>{s.claim_no} - {s.claim_status}</span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '12px' }}>Unclaimed</span>
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
              <div className="modal-title">Record Session</div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-text mb-4" style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>{error}</div>}
                
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label>Patient <span className="required">*</span></label>
                    <select required value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                      <option value="">Select Patient...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} {p.insurer ? `(${p.insurer})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date <span className="required">*</span></label>
                    <input required type="date" value={formData.session_date} onChange={e => setFormData({...formData, session_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Physiotherapist</label>
                    <input type="text" value={formData.physiotherapist} onChange={e => setFormData({...formData, physiotherapist: e.target.value})} placeholder="Dr. Name" />
                  </div>
                  <div className="form-group">
                    <label>Session Type</label>
                    <select value={formData.session_type} onChange={e => setFormData({...formData, session_type: e.target.value})}>
                      <option value="Assessment">Assessment</option>
                      <option value="Treatment">Treatment</option>
                      <option value="Review">Review</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Duration (mins)</label>
                    <input type="number" value={formData.duration_mins} onChange={e => setFormData({...formData, duration_mins: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Session Fee (₹) <span className="required">*</span></label>
                    <input required type="number" step="0.01" min="0" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="form-group form-full">
                    <label>Notes</label>
                    <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Treatment notes..."></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
