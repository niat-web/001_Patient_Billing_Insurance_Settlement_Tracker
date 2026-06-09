import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Sessions from './pages/Sessions';
import Claims from './pages/Claims';
import Settlements from './pages/Settlements';
import PatientLedger from './pages/PatientLedger';
import CopayBalances from './pages/CopayBalances';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/claims" element={<Claims />} />
            <Route path="/settlements" element={<Settlements />} />
            <Route path="/ledger" element={<PatientLedger />} />
            <Route path="/ledger/:id" element={<PatientLedger />} />
            <Route path="/copay" element={<CopayBalances />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a2e', color: '#f1f5f9', border: '1px solid #3d3d65' }
      }} />
    </Router>
  );
}

export default App;
