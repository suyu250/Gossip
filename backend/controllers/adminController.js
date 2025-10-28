const db = require('../config/db');

// Admin login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const [admins] = await db.query(
      'SELECT id, username FROM admins WHERE username = ? AND password = ?',
      [username, password]
    );

    if (admins.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    req.session.adminId = admins[0].id;
    req.session.username = admins[0].username;

    res.json({ success: true, message: 'Login successful', username: admins[0].username });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
};

// Check if admin is logged in
exports.checkAuth = (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({ success: true, authenticated: true, username: req.session.username });
  } else {
    res.json({ success: true, authenticated: false });
  }
};

// Get all groups with entries (for admin panel)
exports.getAllGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await db.query('SELECT COUNT(*) as total FROM `groups`');
    const total = countResult[0].total;

    const [groups] = await db.query(
      `SELECT id, group_number, is_completed, created_at, updated_at
       FROM \`groups\`
       ORDER BY group_number DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const groupsWithEntries = await Promise.all(
      groups.map(async (group) => {
        const [entries] = await db.query(
          `SELECT id, user_identifier, text_content, added_text, solfege, 
                  ip_address, user_agent, position_in_group, created_at
           FROM entries
           WHERE group_id = ?
           ORDER BY position_in_group ASC`,
          [group.id]
        );
        return { ...group, entries };
      })
    );

    res.json({
      success: true,
      groups: groupsWithEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting all groups:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Edit a single entry
exports.editEntry = async (req, res) => {
  try {
    const entryId = req.params.id;
    const { textContent } = req.body;

    if (!textContent) {
      return res.status(400).json({ success: false, message: 'Text content required' });
    }

    const [result] = await db.query(
      'UPDATE entries SET text_content = ? WHERE id = ?',
      [textContent, entryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, message: 'Entry updated successfully' });
  } catch (error) {
    console.error('Error editing entry:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete entire group
exports.deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id;

    // Check if group exists
    const [groups] = await db.query('SELECT id FROM `groups` WHERE id = ?', [groupId]);
    
    if (groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Delete group (entries will be deleted automatically due to CASCADE)
    await db.query('DELETE FROM `groups` WHERE id = ?', [groupId]);

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const adminId = req.session.adminId;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New passwords do not match' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }

    // Verify current password
    const [admins] = await db.query(
      'SELECT id FROM admins WHERE id = ? AND password = ?',
      [adminId, currentPassword]
    );

    if (admins.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    await db.query(
      'UPDATE admins SET password = ? WHERE id = ?',
      [newPassword, adminId]
    );

    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

