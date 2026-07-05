const pool = require('../config/db');

exports.createSettlement = async (req, res) => {
  try {
    const { group_id, to_user, amount, note } = req.body;
    if (!to_user || !amount) {
      return res.status(400).json({ error: 'to_user and amount are required.' });
    }

    const result = await pool.query(
      `INSERT INTO settlements (group_id, from_user, to_user, amount, note)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [group_id || null, req.user.id, to_user, amount, note || null]
    );

    res.status(201).json({ settlement: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while recording the settlement.' });
  }
};

exports.getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await pool.query(
      `SELECT s.*, uf.name AS from_name, ut.name AS to_name FROM settlements s
       JOIN users uf ON uf.id = s.from_user
       JOIN users ut ON ut.id = s.to_user
       WHERE s.group_id = $1 ORDER BY s.created_at DESC`,
      [groupId]
    );
    res.json({ settlements: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching settlements.' });
  }
};
