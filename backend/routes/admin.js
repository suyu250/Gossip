const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Login (no auth required)
router.post('/login', adminController.login);

// Logout
router.post('/logout', adminController.logout);

// Check authentication status
router.get('/check-auth', adminController.checkAuth);

// Protected routes (require authentication)
router.get('/groups', authMiddleware, adminController.getAllGroups);
router.put('/entry/:id', authMiddleware, adminController.editEntry);
router.delete('/group/:id', authMiddleware, adminController.deleteGroup);
router.post('/change-password', authMiddleware, adminController.changePassword);

module.exports = router;

