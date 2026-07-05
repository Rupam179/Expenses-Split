/**
 * Debt Simplification (minimum cash flow problem).
 *
 * Given each person's net balance (positive = they are owed money,
 * negative = they owe money), produce the smallest set of transactions
 * that settles everything.
 *
 * Approach: greedy — repeatedly match the person who owes the most
 * with the person who is owed the most, settle the smaller of the two
 * amounts, and repeat. This does not guarantee the mathematically
 * absolute minimum number of transactions (that's NP-hard in general),
 * but it's the standard, well-known approximation used by real
 * expense-splitting apps and performs very well in practice.
 *
 * @param {Object} netBalances - { userId: netBalanceNumber }
 * @returns {Array} [{ from, to, amount }]
 */
function simplifyDebts(netBalances) {
  const EPSILON = 0.01; // ignore rounding dust below 1 paisa/cent

  // Build arrays of { userId, amount } for creditors (owed money, positive)
  // and debtors (owe money, negative -> store as positive "owes" amount).
  const creditors = [];
  const debtors = [];

  for (const [userId, balance] of Object.entries(netBalances)) {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > EPSILON) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded < -EPSILON) {
      debtors.push({ userId, amount: -rounded });
    }
  }

  // Sort descending so we always match the biggest debtor with biggest creditor first.
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0; // creditors pointer
  let j = 0; // debtors pointer

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > EPSILON) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount <= EPSILON) i++;
    if (debtor.amount <= EPSILON) j++;
  }

  return transactions;
}

module.exports = { simplifyDebts };
