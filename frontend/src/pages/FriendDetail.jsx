import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../api/services';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import AddExpenseModal from '../components/AddExpenseModal';
import { useAuth } from '../context/AuthContext';

export default function FriendDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [friend, setFriend] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = () => {
    setError('');
    Promise.all([api.getFriends(), api.getFriendExpenses(id)])
      .then(([friendsRes, expensesRes]) => {
        const match = friendsRes.data.friends.find((f) => String(f.id) === String(id));
        setFriend(match || { id, name: 'Friend', avatar_color: '#1F6F5C' });
        setExpenses(expensesRes.data.expenses);
      })
      .catch(() => setError('Could not load this friend.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, [id]);

  const netBalance = expenses.reduce((sum, exp) => {
    const paidByMe = exp.payers.filter((p) => p.user_id === user.id).reduce((s, p) => s + Number(p.amount_paid), 0);
    const owedByMe = exp.splits.filter((s) => s.user_id === user.id).reduce((s, sp) => s + Number(sp.amount_owed), 0);
    return sum + (paidByMe - owedByMe);
  }, 0);

  const handleSettleUp = async () => {
    try {
      await api.createSettlement({ group_id: null, to_user: Number(id), amount: Math.abs(netBalance) });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record the settlement.');
    }
  };

  if (loading) return <p className="text-center text-muted mt-16">Loading…</p>;

  const members = friend ? [{ id: user.id, name: user.name, avatar_color: user.avatar_color }, friend] : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={friend.name} color={friend.avatar_color} size={44} />
          <div>
            <h1 className="font-display text-2xl text-ink">{friend.name}</h1>
            <p className={`text-sm font-mono ${netBalance > 0 ? 'text-credit' : netBalance < 0 ? 'text-debit' : 'text-muted'}`}>
              {Math.abs(netBalance) < 0.01
                ? 'You are all settled up'
                : netBalance > 0
                ? `Owes you ₹${netBalance.toFixed(2)}`
                : `You owe ₹${Math.abs(netBalance).toFixed(2)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {Math.abs(netBalance) > 0.01 && netBalance < 0 && (
            <Button variant="secondary" onClick={handleSettleUp}>
              Settle up
            </Button>
          )}
          <Button onClick={() => setShowAddExpense(true)}>+ Add expense</Button>
        </div>
      </div>

      {error && <p className="text-debit">{error}</p>}

      <Card title="Expense history">
        {expenses.length ? (
          <div className="divide-y divide-line">
            {expenses.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-ink font-medium">{exp.description}</p>
                  <p className="text-xs text-muted">
                    {exp.category} · {new Date(exp.expense_date).toLocaleDateString()} · paid by{' '}
                    {exp.payers.map((p) => p.name).join(', ')}
                  </p>
                </div>
                <span className="font-mono font-semibold text-ink">₹{Number(exp.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm py-2">No direct expenses with {friend.name} yet.</p>
        )}
      </Card>

      {showAddExpense && (
        <AddExpenseModal
          members={members}
          groupId={null}
          friendId={id}
          currentUserId={user.id}
          onClose={() => setShowAddExpense(false)}
          onCreated={loadAll}
        />
      )}
    </div>
  );
}
