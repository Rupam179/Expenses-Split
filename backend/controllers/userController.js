const pool = require('../config/db');

// Search for a user by exact/partial email, so people can add friends to groups.
exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (!q) return res.json({ users: [] });

    const result = await pool.query(
      `SELECT id, name, email, avatar_color FROM users
       WHERE LOWER(email) LIKE $1 OR LOWER(name) LIKE $1
       AND id != $2
       LIMIT 10`,
      [`%${q}%`, req.user.id]
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while searching users.' });
  }
};

// All people the current user has shared a group or expense with ("friends").
exports.getFriends = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.avatar_color
       FROM users u
       WHERE u.id IN (
         SELECT gm2.user_id FROM group_members gm1
         JOIN group_members gm2 ON gm1.group_id = gm2.group_id
         WHERE gm1.user_id = $1 AND gm2.user_id != $1
         UNION
         SELECT ep.user_id FROM expense_payers ep
         JOIN expenses e ON e.id = ep.expense_id
         WHERE e.group_id IS NULL AND ep.expense_id IN (
           SELECT expense_id FROM expense_splits WHERE user_id = $1
         ) AND ep.user_id != $1
         UNION
         SELECT es.user_id FROM expense_splits es
         JOIN expenses e ON e.id = es.expense_id
         WHERE e.group_id IS NULL AND e.id IN (
           SELECT expense_id FROM expense_payers WHERE user_id = $1
         ) AND es.user_id != $1
       )`,
      [req.user.id]
    );
    res.json({ friends: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching friends.' });
  }
};
