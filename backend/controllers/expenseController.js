const pool = require('../config/db');

/**
 * Turns raw split input into { userId: amountOwed } based on split_type.
 * participants: [{ user_id, value }]  -- value meaning depends on split_type:
 *   equal      -> value ignored, split evenly among all participants
 *   exact      -> value is the exact amount owed
 *   percentage -> value is a percentage (0-100), converted to amount
 *   shares     -> value is a share count (e.g. 1, 2, 3), converted proportionally
 */
function computeSplits(amount, splitType, participants) {
  const total = Number(amount);
  const splits = {};

  if (splitType === 'exact') {
    let sum = 0;
    participants.forEach((p) => {
      splits[p.user_id] = Number(p.value);
      sum += Number(p.value);
    });
    if (Math.abs(sum - total) > 0.02) {
      throw new Error(`Exact split amounts (${sum.toFixed(2)}) must add up to the total (${total.toFixed(2)}).`);
    }
    return splits;
  }

  if (splitType === 'percentage') {
    let sumPct = 0;
    participants.forEach((p) => (sumPct += Number(p.value)));
    if (Math.abs(sumPct - 100) > 0.5) {
      throw new Error(`Percentages must add up to 100 (got ${sumPct}).`);
    }
    let allocated = 0;
    participants.forEach((p, idx) => {
      let share = Math.round(total * (Number(p.value) / 100) * 100) / 100;
      if (idx === participants.length - 1) {
        // last participant absorbs rounding difference
        share = Math.round((total - allocated) * 100) / 100;
      }
      allocated += share;
      splits[p.user_id] = share;
    });
    return splits;
  }

  if (splitType === 'shares') {
    const totalShares = participants.reduce((s, p) => s + Number(p.value), 0);
    if (totalShares <= 0) throw new Error('Total shares must be greater than zero.');
    let allocated = 0;
    participants.forEach((p, idx) => {
      let share = Math.round((total * (Number(p.value) / totalShares)) * 100) / 100;
      if (idx === participants.length - 1) {
        share = Math.round((total - allocated) * 100) / 100;
      }
      allocated += share;
      splits[p.user_id] = share;
    });
    return splits;
  }

  // default: equal split
  const n = participants.length;
  const base = Math.floor((total / n) * 100) / 100;
  let allocated = 0;
  participants.forEach((p, idx) => {
    let share = base;
    if (idx === n - 1) {
      share = Math.round((total - allocated) * 100) / 100;
    }
    allocated += share;
    splits[p.user_id] = share;
  });
  return splits;
}

exports.createExpense = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      group_id,
      description,
      amount,
      currency,
      category,
      split_type,
      expense_date,
      payers,       // [{ user_id, amount_paid }]
      participants, // [{ user_id, value }]
    } = req.body;

    if (!description || !amount || !payers?.length || !participants?.length) {
      return res.status(400).json({
        error: 'Description, amount, at least one payer, and at least one participant are required.',
      });
    }

    const payersSum = payers.reduce((s, p) => s + Number(p.amount_paid), 0);
    if (Math.abs(payersSum - Number(amount)) > 0.02) {
      return res.status(400).json({
        error: `Payer amounts (${payersSum.toFixed(2)}) must add up to the total expense amount (${Number(amount).toFixed(2)}).`,
      });
    }

    let splits;
    try {
      splits = computeSplits(amount, split_type || 'equal', participants);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    await client.query('BEGIN');

    const expenseResult = await client.query(
      `INSERT INTO expenses (group_id, description, amount, currency, category, split_type, created_by, expense_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        group_id || null,
        description.trim(),
        amount,
        currency || 'INR',
        category || 'General',
        split_type || 'equal',
        req.user.id,
        expense_date || new Date().toISOString().slice(0, 10),
      ]
    );
    const expense = expenseResult.rows[0];

    for (const p of payers) {
      await client.query(
        `INSERT INTO expense_payers (expense_id, user_id, amount_paid) VALUES ($1,$2,$3)`,
        [expense.id, p.user_id, p.amount_paid]
      );
    }

    for (const [userId, owed] of Object.entries(splits)) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, amount_owed) VALUES ($1,$2,$3)`,
        [expense.id, userId, owed]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ expense, splits, payers });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while creating the expense.' });
  } finally {
    client.release();
  }
};

exports.getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const expensesResult = await pool.query(
      `SELECT * FROM expenses WHERE group_id = $1 ORDER BY expense_date DESC, created_at DESC`,
      [groupId]
    );
    const expenses = expensesResult.rows;

    for (const exp of expenses) {
      const payers = await pool.query(
        `SELECT ep.user_id, ep.amount_paid, u.name FROM expense_payers ep
         JOIN users u ON u.id = ep.user_id WHERE ep.expense_id = $1`,
        [exp.id]
      );
      const splits = await pool.query(
        `SELECT es.user_id, es.amount_owed, u.name FROM expense_splits es
         JOIN users u ON u.id = es.user_id WHERE es.expense_id = $1`,
        [exp.id]
      );
      exp.payers = payers.rows;
      exp.splits = splits.rows;
    }

    res.json({ expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching expenses.' });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const expResult = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    if (expResult.rows.length === 0) return res.status(404).json({ error: 'Expense not found.' });

    const payers = await pool.query(
      `SELECT ep.user_id, ep.amount_paid, u.name FROM expense_payers ep
       JOIN users u ON u.id = ep.user_id WHERE ep.expense_id = $1`,
      [id]
    );
    const splits = await pool.query(
      `SELECT es.user_id, es.amount_owed, u.name FROM expense_splits es
       JOIN users u ON u.id = es.user_id WHERE es.expense_id = $1`,
      [id]
    );

    res.json({ expense: expResult.rows[0], payers: payers.rows, splits: splits.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching the expense.' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expResult = await pool.query('SELECT created_by FROM expenses WHERE id = $1', [id]);
    if (expResult.rows.length === 0) return res.status(404).json({ error: 'Expense not found.' });
    if (expResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the person who added this expense can delete it.' });
    }
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while deleting the expense.' });
  }
};

exports.getFriendExpenses = async (req, res) => {
  try {
    const { friendId } = req.params;
    const result = await pool.query(
      `SELECT e.* FROM expenses e
       WHERE e.group_id IS NULL
       AND e.id IN (SELECT expense_id FROM expense_payers WHERE user_id = $1 OR user_id = $2)
       AND e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = $1 OR user_id = $2)
       ORDER BY e.expense_date DESC, e.created_at DESC`,
      [req.user.id, friendId]
    );
    const expenses = result.rows;
    for (const exp of expenses) {
      const payers = await pool.query(
        `SELECT ep.user_id, ep.amount_paid, u.name FROM expense_payers ep
         JOIN users u ON u.id = ep.user_id WHERE ep.expense_id = $1`,
        [exp.id]
      );
      const splits = await pool.query(
        `SELECT es.user_id, es.amount_owed, u.name FROM expense_splits es
         JOIN users u ON u.id = es.user_id WHERE es.expense_id = $1`,
        [exp.id]
      );
      exp.payers = payers.rows;
      exp.splits = splits.rows;
    }
    res.json({ expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching expenses.' });
  }
};
