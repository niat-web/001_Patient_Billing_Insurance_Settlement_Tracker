const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const patients = require('./routes/patients');
const sessions = require('./routes/sessions');
const claims = require('./routes/claims');
const settlements = require('./routes/settlements');
const dashboard = require('./routes/dashboard');

// Middleware
app.use(cors({
  origin: "https://zero01-patient-billing-insurance-aplm.onrender.com",
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'patient-billing---insurance-settlement-tracker',
    company: 'Delight Physiotherapy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/patients', patients);
app.use('/api/sessions', sessions);
app.use('/api/claims', claims);
app.use('/api/settlements', settlements);
app.use('/api/dashboard', dashboard);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🏥 Delight Physiotherapy - Patient Billing System`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
