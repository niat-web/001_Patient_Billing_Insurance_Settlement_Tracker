import React, { useEffect, useState } from 'react';
import { getPatients, createPatient } from '../services/api';
import { Link } from 'react-router-dom';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', date_of_birth: '', insurer: '', policy_no: '', preauth_code: '', approved_sessions: ''
  });
  const [error, setError] = useState('');

  const loadPatients = (searchQuery = '') => {
    setLoading(true);
    getPatients(searchQuery)
      .then(r => setPatients(r.data.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPatients(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadPatients(search);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createPatient(formData);
      setShowModal(false);
      setFormData({ name: '', phone: '', email: '', date_of_birth: '', insurer: '', policy_no: '', preauth_code: '', approved_sessions: '' });
      loadPatients();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register patient');
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Manage patient registrations and insurance details</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Register Patient
        </button>
      </div>

      <div className="card">
        <form className="search-filter-bar" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, policy, or insurer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-ghost">Search</button>
          {search && <button type="button" className="btn btn-ghost" onClick={() => { setSearch(''); loadPatients(''); }}>Clear</button>}
        </form>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner"></div></div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No patients found</div>
            <div className="empty-state-desc">Register a new patient to get started.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Insurance</th>
                  <th>Policy Info</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>ID: {p.id}</div>
                    </td>
                    <td>
                      <div>{p.phone || '—'}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{p.email}</div>
                    </td>
                    <td>{p.insurer || '—'}</td>
                    <td>
                      {p.policy_no && <div>Policy: {p.policy_no}</div>}
                      {p.preauth_code && <div className="text-muted" style={{ fontSize: '11px' }}>PreAuth: {p.preauth_code}</div>}
                    </td>
                    <td>
                      <Link to={`/ledger/${p.id}`} className="btn btn-sm btn-ghost" style={{ marginRight: '8px' }}>View Ledger</Link>
                      <button onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${p.name}? This action cannot be undone.`)) {
                          import('../services/api').then(({ deletePatient }) => {
                            deletePatient(p.id).then(() => loadPatients(search)).catch(err => alert(err.response?.data?.message || 'Failed to delete patient'));
                          });
                        }
                      }} className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Register New Patient</div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-text mb-4" style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>{error}</div>}
                
                <h4 style={{ marginBottom: '16px', color: 'var(--primary-light)' }}>Personal Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name <span className="required">*</span></label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Patient Name" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone" />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
                  </div>
                </div>

                <hr className="divider" />
                <h4 style={{ marginBottom: '16px', color: 'var(--primary-light)' }}>Insurance Details</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Insurer Name</label>
                    <input type="text" value={formData.insurer} onChange={e => setFormData({...formData, insurer: e.target.value})} placeholder="e.g. Star Health" />
                  </div>
                  <div className="form-group">
                    <label>Policy Number</label>
                    <input type="text" value={formData.policy_no} onChange={e => setFormData({...formData, policy_no: e.target.value})} placeholder="Policy No" />
                  </div>
                  <div className="form-group">
                    <label>Pre-Authorisation Code</label>
                    <input type="text" value={formData.preauth_code} onChange={e => setFormData({...formData, preauth_code: e.target.value})} placeholder="Pre-Auth Code" />
                  </div>
                  <div className="form-group">
                    <label>Approved Sessions</label>
                    <input type="number" min="0" value={formData.approved_sessions} onChange={e => setFormData({...formData, approved_sessions: e.target.value})} placeholder="Count" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Register Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
