const pool = require('../config/db');
const { simplifyDebts } = require('../utils/debtSimplify');

// Net balance for every member of a group: total paid - total owed (+ settlements)
exports.getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.avatar_color FROM users u
       JOIN group_members gm ON gm.user_id = u.id WHERE gm.group_id = $1`,
      [groupId]
    );
    const members = membersResult.rows;
    const net = {};
    members.forEach((m) => (net[m.id] = 0));

    const paidResult = await pool.query(
      `SELECT ep.user_id, SUM(ep.amount_paid) AS total_paid FROM expense_payers ep
       JOIN expenses e ON e.id = ep.expense_id WHERE e.group_id = $1 GROUP BY ep.user_id`,
      [groupId]
    );
    paidResult.rows.forEach((r) => (net[r.user_id] = (net[r.user_id] || 0) + Number(r.total_paid)));

    const owedResult = await pool.query(
      `SELECT es.user_id, SUM(es.amount_owed) AS total_owed FROM expense_splits es
       JOIN expenses e ON e.id = es.expense_id WHERE e.group_id = $1 GROUP BY es.user_id`,
      [groupId]
    );
    owedResult.rows.forEach((r) => (net[r.user_id] = (net[r.user_id] || 0) - Number(r.total_owed)));

    const settlementsResult = await pool.query(
      `SELECT from_user, to_user, amount FROM settlements WHERE group_id = $1`,
      [groupId]
    );
    settlementsResult.rows.forEach((s) => {
      net[s.from_user] = (net[s.from_user] || 0) + Number(s.amount); // paying reduces what you owe
      net[s.to_user] = (net[s.to_user] || 0) - Number(s.amount); // receiving reduces what you're owed
    });

    const transactions = simplifyDebts(net);

    const memberMap = {};
    members.forEach((m) => (memberMap[m.id] = m));

    res.json({
      balances: members.map((m) => ({ ...m, net_balance: Math.round((net[m.id] || 0) * 100) / 100 })),
      settle_up_plan: transactions.map((t) => ({
        from: memberMap[t.from],
        to: memberMap[t.to],
        amount: t.amount,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while calculating balances.' });
  }
};

// Overall balance summary for the logged-in user across every group + direct expenses.
exports.getMySummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(amount_paid),0) AS total FROM expense_payers WHERE user_id = $1`,
      [userId]
    );
    const owedResult = await pool.query(
      `SELECT COALESCE(SUM(amount_owed),0) AS total FROM expense_splits WHERE user_id = $1`,
      [userId]
    );
    const settledOutResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM settlements WHERE from_user = $1`,
      [userId]
    );
    const settledInResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM settlements WHERE to_user = $1`,
      [userId]
    );

    const net =
      Number(paidResult.rows[0].total) -
      Number(owedResult.rows[0].total) +
      Number(settledOutResult.rows[0].total) -
      Number(settledInResult.rows[0].total);

    // Per-friend breakdown (direct, non-group net balance with each person)
    const friendResult = await pool.query(
      `SELECT u.id, u.name, u.avatar_color,
        COALESCE((SELECT SUM(ep.amount_paid) FROM expense_payers ep
          JOIN expenses e ON e.id = ep.expense_id
          WHERE ep.user_id = $1 AND e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = u.id)), 0)
        -
        COALESCE((SELECT SUM(es.amount_owed) FROM expense_splits es
          JOIN expenses e ON e.id = es.expense_id
          WHERE es.user_id = $1 AND e.id IN (SELECT expense_id FROM expense_payers WHERE user_id = u.id)), 0)
        AS net_with_friend
       FROM users u WHERE u.id != $1`,
      [userId]
    );

    const friendsWithBalance = friendResult.rows.filter((f) => Math.abs(Number(f.net_with_friend)) > 0.01);

    res.json({
      net_balance: Math.round(net * 100) / 100,
      you_are_owed: Math.max(net, 0),
      you_owe: Math.max(-net, 0),
      friends: friendsWithBalance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while calculating your summary.' });
  }
};
