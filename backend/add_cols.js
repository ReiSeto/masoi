const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function addColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });
  
  try {
    await connection.execute('ALTER TABLE users ADD COLUMN reputation INT DEFAULT 100;');
    console.log('Added reputation');
  } catch(e) { console.log('reputation exists', e.message); }
  
  try {
    await connection.execute('ALTER TABLE users ADD COLUMN last_reputation_recovery DATETIME DEFAULT CURRENT_TIMESTAMP;');
    console.log('Added last_reputation_recovery');
  } catch(e) { console.log('last_reputation_recovery exists', e.message); }
  
  process.exit();
}
addColumns();
