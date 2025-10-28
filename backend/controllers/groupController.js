const db = require('../config/db');

// Get current group (find an incomplete group or create a new one)
exports.getCurrentGroup = async (req, res) => {
  try {
    // Find incomplete group with less than 5 entries
    const [groups] = await db.query(
      `SELECT g.id, g.group_number, g.is_completed, 
              COUNT(e.id) as entry_count
       FROM \`groups\` g
       LEFT JOIN entries e ON g.id = e.group_id
       WHERE g.is_completed = 0
       GROUP BY g.id
       HAVING entry_count < 5
       ORDER BY g.created_at ASC
       LIMIT 1`
    );

    let currentGroup;
    
    if (groups.length > 0) {
      currentGroup = groups[0];
    } else {
      // Create new group
      const [lastGroup] = await db.query(
        'SELECT group_number FROM `groups` ORDER BY group_number DESC LIMIT 1'
      );
      const nextGroupNumber = lastGroup.length > 0 ? lastGroup[0].group_number + 1 : 1;
      
      const [result] = await db.query(
        'INSERT INTO `groups` (group_number, is_completed) VALUES (?, 0)',
        [nextGroupNumber]
      );
      
      currentGroup = {
        id: result.insertId,
        group_number: nextGroupNumber,
        is_completed: 0,
        entry_count: 0
      };
    }

    // Get all entries for this group
    const [entries] = await db.query(
      `SELECT id, text_content, added_text, solfege, position_in_group, created_at
       FROM entries
       WHERE group_id = ?
       ORDER BY position_in_group ASC`,
      [currentGroup.id]
    );

    res.json({
      success: true,
      group: {
        id: currentGroup.id,
        group_number: currentGroup.group_number,
        entry_count: entries.length,
        entries: entries
      }
    });
  } catch (error) {
    console.error('Error getting current group:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Submit a new entry
exports.submitEntry = async (req, res) => {
  try {
    const { groupId, textContent, addedText, solfege, userIdentifier } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'];

    // Validate input
    if (!groupId || !textContent || !addedText) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if group exists and is not completed
    const [groups] = await db.query(
      'SELECT id, is_completed FROM `groups` WHERE id = ?',
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (groups[0].is_completed) {
      return res.status(400).json({ success: false, message: 'Group is already completed' });
    }

    // Get current entry count
    const [entries] = await db.query(
      'SELECT COUNT(*) as count FROM entries WHERE group_id = ?',
      [groupId]
    );

    const position = entries[0].count + 1;

    if (position > 5) {
      return res.status(400).json({ success: false, message: 'Group is full' });
    }

    // Verify that textContent starts with previous content
    if (position > 1) {
      const [prevEntries] = await db.query(
        'SELECT text_content FROM entries WHERE group_id = ? ORDER BY position_in_group DESC LIMIT 1',
        [groupId]
      );
      
      if (prevEntries.length > 0) {
        const prevText = prevEntries[0].text_content;
        if (!textContent.startsWith(prevText)) {
          return res.status(400).json({ 
            success: false, 
            message: 'You can only append text, not modify previous content' 
          });
        }
      }
    }

    // Insert entry
    await db.query(
      `INSERT INTO entries 
       (group_id, user_identifier, text_content, added_text, solfege, ip_address, user_agent, position_in_group)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [groupId, userIdentifier, textContent, addedText, solfege, ipAddress, userAgent, position]
    );

    // Check if group is complete
    if (position === 5) {
      await db.query(
        'UPDATE `groups` SET is_completed = 1 WHERE id = ?',
        [groupId]
      );
    }

    res.json({ success: true, message: 'Entry submitted successfully', position });
  } catch (error) {
    console.error('Error submitting entry:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get completed groups with pagination
exports.getCompletedGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count of groups (including incomplete ones for display)
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM `groups`'
    );
    const total = countResult[0].total;

    // Get groups with their entries
    const [groups] = await db.query(
      `SELECT id, group_number, is_completed, created_at
       FROM \`groups\`
       ORDER BY group_number DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get entries for each group
    const groupsWithEntries = await Promise.all(
      groups.map(async (group) => {
        const [entries] = await db.query(
          `SELECT id, text_content, added_text, solfege, position_in_group, created_at
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
    console.error('Error getting completed groups:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

