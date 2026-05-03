const { Pool } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

console.log('DATABASE_URL:', DATABASE_URL);

if (!DATABASE_URL) {
  console.error('DATABASE_URL is missing');
  process.exit(1);
}

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err);
  } else {
    console.log('Connection successful:', res.rows[0]);
  }
  pool.end();
});
