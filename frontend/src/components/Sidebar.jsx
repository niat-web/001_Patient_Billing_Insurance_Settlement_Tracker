import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/patients', icon: '👥', label: 'Patients' },
  { path: '/sessions', icon: '🏥', label: 'Sessions' },
  { path: '/claims', icon: '📋', label: 'Insurance Claims' },
  { path: '/settlements', icon: '💰', label: 'Settlements' },
  { path: '/ledger', icon: '📒', label: 'Patient Ledger' },
  { path: '/copay', icon: '⚠️', label: 'Co-Pay Balances' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <span style={{ fontSize: '20px' }}>🏥</span>
        </div>
        <div className="logo-title">Delight Physiotherapy</div>
        <div className="logo-subtitle">Billing & Insurance Tracker</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="nav-section-label" style={{ marginTop: '20px' }}>Info</div>
        <div style={{ padding: '12px', background: 'rgba(99,102,241,0.08)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Core Formula</div>
          <div style={{ fontSize: '12px', color: 'var(--primary-light)', fontWeight: '600', fontFamily: 'monospace' }}>
            Co-Pay = Fee − Settled
          </div>
        </div>
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          June 2026
        </div>
      </div>
    </aside>
  );
}
