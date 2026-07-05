const pool = require('../config/db');

exports.createGroup = async (req, res) => {
  try {
    const { name, group_type, member_ids } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required.' });

    const groupResult = await pool.query(
      `INSERT INTO groups (name, group_type, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), group_type || 'other', req.user.id]
    );
    const group = groupResult.rows[0];

    const memberIds = new Set([req.user.id, ...(member_ids || [])]);
    for (const uid of memberIds) {
      await pool.query(
        `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [group.id, uid]
      );
    }

    res.status(201).json({ group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while creating the group.' });
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json({ groups: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching groups.' });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const membership = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group.' });
    }

    const groupResult = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_color FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [id]
    );

    res.json({ group: groupResult.rows[0], members: membersResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching the group.' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const membership = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group.' });
    }

    await pool.query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id, user_id]
    );
    res.status(201).json({ message: 'Member added.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while adding the member.' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    await pool.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Member removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while removing the member.' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const groupResult = await pool.query('SELECT created_by FROM groups WHERE id = $1', [id]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found.' });
    }
    if (groupResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the group creator can delete this group.' });
    }
    await pool.query('DELETE FROM groups WHERE id = $1', [id]);
    res.json({ message: 'Group deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while deleting the group.' });
  }
};
