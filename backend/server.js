const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'gossip-murmur-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));
// Serve template images
app.use('/template-img', express.static(path.join(__dirname, '../template-img')));
// Serve font files
app.use('/font', express.static(path.join(__dirname, '../public/font')));

// API Routes
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/input', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/input.html'));
});

app.get('/transition', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/transition.html'));
});

app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/gallery.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin-login.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   - Admin Login:  http://localhost:${PORT}/admin-login`);
  console.log('='.repeat(60));
});

