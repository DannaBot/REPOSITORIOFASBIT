const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = process.env.MYSQL_PORT || 3306;
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'fasbit';

let pool;

async function init() {
  try {
    console.log('[db] Initializing MySQL pool', { host: MYSQL_HOST, user: MYSQL_USER, database: MYSQL_DATABASE });
    pool = mysql.createPool({ host: MYSQL_HOST, port: MYSQL_PORT, user: MYSQL_USER, password: MYSQL_PASSWORD, database: MYSQL_DATABASE, waitForConnections: true, connectionLimit: 10 });

    // Ensure tables exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS theses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title TEXT,
        author TEXT,
        student_id VARCHAR(255),
        email VARCHAR(255),
        abstract TEXT,
        advisor VARCHAR(255),
        career VARCHAR(255),
        year INT,
        keywords TEXT,
        status VARCHAR(50),
        downloads INT DEFAULT 0,
        pdf_filename VARCHAR(255),
        approval_filename VARCHAR(255),
        \`fulltext\` LONGTEXT,
        created_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(50),
        created_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure visibility column exists for theses (0 = visible, 1 = hidden)
    try {
      await pool.execute(`ALTER TABLE theses ADD COLUMN hidden TINYINT(1) DEFAULT 0`);
      console.log('[db] Added missing column `hidden` to `theses`');
    } catch (e) {
      // If column already exists, ignore error
      if (e && e.message && e.message.includes('Duplicate column name')) {
        // already exists
      } else {
        // other errors should be logged but not abort init
        console.warn('[db] warning adding hidden column:', e && e.message ? e.message : e);
      }
    }

    // Ensure thesis_date column exists for theses (DATE)
    try {
      await pool.execute(`ALTER TABLE theses ADD COLUMN thesis_date DATE NULL`);
      console.log('[db] Added missing column `thesis_date` to `theses`');
    } catch (e) {
      if (e && e.message && e.message.includes('Duplicate column name')) {
        // already exists
      } else {
        console.warn('[db] warning adding thesis_date column:', e && e.message ? e.message : e);
      }
    }
    // Seed admin if not exists
    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', ['admin@fasbit.local']);
    if (rows.length === 0) {
      const defaultAdminPassword = 'admin123';
      const hash = bcrypt.hashSync(defaultAdminPassword, 10);
      await pool.execute('INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)', ['admin@fasbit.local', hash, 'admin', new Date()]);
      console.log('[db] Seeded default admin: admin@fasbit.local / admin123');
    } else {
      console.log('[db] Admin user already exists, skipping seed');
    }

    console.log('[db] Initialization complete');
  } catch (err) {
    console.error('[db] Initialization error', err && err.stack ? err.stack : err);
    throw err;
  }
}

function getPool() {
  if (!pool) throw new Error('DB pool not initialized. Call init() first.');
  return pool;
}

module.exports = { init, getPool };
