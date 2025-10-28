// Configuration example file
// Copy this to config.js and update with your settings

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: 'localhost'
  },

  // Database configuration
  database: {
    host: 'localhost',
    user: 'root',
    password: '', // Your MySQL password
    database: 'gossip_db',
    charset: 'utf8mb4'
  },

  // Session configuration
  session: {
    secret: 'gossip-murmur-secret-key-2024', // Change this to a random string
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

