import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// Patients
export const getPatients = (search) => API.get('/api/patients', { params: { search } });
export const getPatient = (id) => API.get(`/api/patients/${id}`);
export const createPatient = (data) => API.post('/api/patients', data);
export const updatePatient = (id, data) => API.put(`/api/patients/${id}`, data);
export const deletePatient = (id) => API.delete(`/api/patients/${id}`);

// Sessions
export const getSessions = (params) => API.get('/api/sessions', { params });
export const getSession = (id) => API.get(`/api/sessions/${id}`);
export const createSession = (data) => API.post('/api/sessions', data);

// Claims
export const getClaims = (params) => API.get('/api/claims', { params });
export const createClaim = (data) => API.post('/api/claims', data);
export const updateClaimStatus = (id, status) => API.patch(`/api/claims/${id}/status`, { status });

// Settlements
export const getSettlements = () => API.get('/api/settlements');
export const createSettlement = (data) => API.post('/api/settlements', data);

// Dashboard
export const getDashboardSummary = () => API.get('/api/dashboard/summary');
export const getCopayBalances = () => API.get('/api/dashboard/copay-balances');

export default API;
