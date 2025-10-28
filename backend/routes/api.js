const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// Get current group
router.get('/current-group', groupController.getCurrentGroup);

// Submit entry
router.post('/submit-entry', groupController.submitEntry);

// Get completed groups (with pagination)
router.get('/completed-groups', groupController.getCompletedGroups);

module.exports = router;

