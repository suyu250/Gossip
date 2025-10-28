const mysql = require('mysql2');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'gossip_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Get promise-based pool
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Database connected successfully');
  console.log(`📦 Database: ${dbConfig.database} @ ${dbConfig.host}`);
  console.log(`👤 User: ${dbConfig.user}`);
  connection.release();
});

module.exports = promisePool;

