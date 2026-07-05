const { Pool } = require('pg');
require('dotenv').config();

// Render/production Postgres needs SSL; local dev usually doesn't.
const useSSL = process.env.DATABASE_SSL !== 'false';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
});

module.exports = pool;
