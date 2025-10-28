// Authentication middleware for admin routes
const authMiddleware = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
};

module.exports = authMiddleware;

