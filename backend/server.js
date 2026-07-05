require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');
const balanceRoutes = require('./routes/balances');
const settlementRoutes = require('./routes/settlements');

const app = express();

// Allow the frontend origin(s). Set FRONTEND_URL in production (Render env vars).
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Expenses Split API is running.' });
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/settlements', settlementRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

// Creates tables automatically if they don't exist yet — this means you never
// need shell/SSH access on Render's free tier to run migrations manually.
// The schema uses "CREATE TABLE IF NOT EXISTS", so this is safe to run on every boot.
async function runMigrations() {
  const sql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ Database schema is up to date.');
}

const PORT = process.env.PORT || 5000;

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to run database migrations on startup:', err.message);
    // Still start the server so /health works and logs are visible,
    // but most routes will fail until DATABASE_URL is fixed.
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (without a verified database connection)`);
    });
  });

