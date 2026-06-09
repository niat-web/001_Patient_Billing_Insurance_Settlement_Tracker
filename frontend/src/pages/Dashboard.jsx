import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { getDashboardSummary } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardSummary()
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-wrapper">
      <div className="spinner"></div>
      <span>Loading dashboard...</span>
    </div>
  );

  if (error) return (
    <div className="empty-state">
      <div className="empty-state-icon">⚠️</div>
      <div className="empty-state-title">Failed to load</div>
      <div className="empty-state-desc">{error}</div>
    </div>
  );

  const totals = data?.totals || {};
  const claimsByStatus = data?.claimsByStatus || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const physiotherapistStats = data?.physiotherapistStats || [];
  const outstandingCopay = data?.outstandingCopay || [];

  // Chart data
  const barChartData = {
    labels: monthlyTrend.map(m => m.month_label),
    datasets: [
      {
        label: 'Total Billed',
        data: monthlyTrend.map(m => parseFloat(m.total_billed || 0)),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: '#6366f1',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Insurance Settled',
        data: monthlyTrend.map(m => parseFloat(m.total_settled || 0)),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Patient Outstanding',
        data: monthlyTrend.map(m => parseFloat(m.total_outstanding || 0)),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: '#ef4444',
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
      tooltip: { backgroundColor: '#1a1a2e', titleColor: '#f1f5f9', bodyColor: '#94a3b8' },
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(45,45,80,0.5)' } },
      y: { ticks: { color: '#94a3b8', callback: v => `₹${(v/1000).toFixed(0)}K` }, grid: { color: 'rgba(45,45,80,0.5)' } },
    },
  };

  const statusColorMap = {
    Pending: 'rgba(245,158,11,0.8)',
    Approved: 'rgba(14,165,233,0.8)',
    Settled: 'rgba(16,185,129,0.8)',
    Rejected: 'rgba(239,68,68,0.8)',
  };

  const pieChartData = {
    labels: claimsByStatus.map(c => c.status),
    datasets: [{
      data: claimsByStatus.map(c => parseInt(c.count)),
      backgroundColor: claimsByStatus.map(c => statusColorMap[c.status] || '#6366f1'),
      borderColor: '#1a1a2e',
      borderWidth: 3,
    }],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 12 }, padding: 16 } },
      tooltip: { backgroundColor: '#1a1a2e', titleColor: '#f1f5f9', bodyColor: '#94a3b8' },
    },
  };

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing Dashboard</h1>
          <p className="page-subtitle">Delight Physiotherapy — Real-time financial overview</p>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div>📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card primary">
          <div className="stat-icon primary">🏥</div>
          <div className="stat-value">{totals.total_sessions || 0}</div>
          <div className="stat-label">Total Sessions Billed</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon info">💵</div>
          <div className="stat-value" style={{ fontSize: '18px' }}>{fmt(totals.total_billed)}</div>
          <div className="stat-label">Total Amount Billed</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon warning">⏳</div>
          <div className="stat-value" style={{ fontSize: '18px' }}>{fmt(totals.insurance_pending)}</div>
          <div className="stat-label">Insurance Pending ({totals.pending_claims_count || 0} claims)</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon success">✅</div>
          <div className="stat-value" style={{ fontSize: '18px' }}>{fmt(totals.insurance_settled)}</div>
          <div className="stat-label">Insurance Settled ({totals.settled_claims_count || 0} claims)</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon danger">⚠️</div>
          <div className="stat-value" style={{ fontSize: '18px' }}>{fmt(totals.total_copay_outstanding)}</div>
          <div className="stat-label">Patient Co-Pay Outstanding</div>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="card">
          <div className="card-title">📈 Monthly Billing vs Settled vs Outstanding</div>
          <div className="chart-container">
            {monthlyTrend.length > 0
              ? <Bar data={barChartData} options={barOptions} />
              : <div className="empty-state"><div className="empty-state-desc">No session data yet</div></div>
            }
          </div>
        </div>
        <div className="card">
          <div className="card-title">🥧 Claim Status Distribution</div>
          <div className="chart-container">
            {claimsByStatus.length > 0
              ? <Pie data={pieChartData} options={pieOptions} />
              : <div className="empty-state"><div className="empty-state-desc">No claims yet</div></div>
            }
          </div>
        </div>
      </div>

      {/* Physiotherapist Stats + Outstanding Co-pay */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Physiotherapist */}
        <div className="card">
          <div className="card-title">👩‍⚕️ Physiotherapist Session Count</div>
          {physiotherapistStats.length === 0
            ? <div className="empty-state"><div className="empty-state-desc">No session data</div></div>
            : <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Physiotherapist</th>
                      <th className="text-right">Sessions</th>
                      <th className="text-right">Total Billed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {physiotherapistStats.map((p, i) => (
                      <tr key={i}>
                        <td className="font-bold">{p.physiotherapist}</td>
                        <td className="text-right">
                          <span className="badge badge-approved">{p.session_count}</span>
                        </td>
                        <td className="text-right amount amount-positive">{fmt(p.total_billed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>

        {/* Outstanding Co-Pay */}
        <div className="card">
          <div className="card-title">🚨 Top Outstanding Co-Pay Patients</div>
          {outstandingCopay.length === 0
            ? <div className="empty-state"><div className="empty-state-desc">No outstanding balances 🎉</div></div>
            : <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Insurer</th>
                      <th className="text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingCopay.map((p, i) => (
                      <tr key={i}>
                        <td>
                          <div className="font-bold">{p.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.phone}</div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.insurer || '—'}</td>
                        <td className="text-right">
                          <span className="amount amount-danger">{fmt(p.total_outstanding)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      </div>
    </div>
  );
}
