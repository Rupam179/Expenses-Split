import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../api/services';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';
import LedgerRow from '../components/LedgerRow';
import AddExpenseModal from '../components/AddExpenseModal';
import { useAuth } from '../context/AuthContext';

const TABS = ['Expenses', 'Balances', 'Settle up', 'Members'];

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [tab, setTab] = useState('Expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = () => {
    setError('');
    Promise.all([api.getGroup(id), api.getGroupExpenses(id), api.getGroupBalances(id)])
      .then(([groupRes, expensesRes, balancesRes]) => {
        setGroup(groupRes.data.group);
        setMembers(groupRes.data.members);
        setExpenses(expensesRes.data.expenses);
        setBalances(balancesRes.data);
      })
      .catch(() => setError('Could not load this group.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, [id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    try {
      const res = await api.searchUsers(inviteEmail.trim());
      const match = res.data.users.find((u) => u.email.toLowerCase() === inviteEmail.trim().toLowerCase());
      if (!match) {
        setInviteError('No Tally user found with that email.');
        return;
      }
      await api.addGroupMember(id, match.id);
      setInviteEmail('');
      loadAll();
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Could not add that member.');
    }
  };

  const handleSettleUp = async (fromId, toId, amount) => {
    // Only the person who owes (or an admin) records that they paid.
    try {
      await api.createSettlement({ group_id: id, to_user: toId, amount });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record the settlement.');
    }
  };

  if (loading) return <p className="text-center text-muted mt-16">Loading group…</p>;
  if (error) return <p className="text-center text-debit mt-16">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">{group.name}</h1>
          <p className="text-muted mt-1">{members.length} members</p>
        </div>
        <Button onClick={() => setShowAddExpense(true)}>+ Add expense</Button>
      </div>

      <div className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Expenses' && (
        <Card>
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
            <p className="text-muted text-sm py-2">No expenses yet. Add the first one!</p>
          )}
        </Card>
      )}

      {tab === 'Balances' && (
        <Card title="Who owes what">
          {balances?.balances?.length ? (
            <div className="divide-y divide-line">
              {balances.balances.map((b) => (
                <LedgerRow key={b.id} name={b.name} color={b.avatar_color} amount={Number(b.net_balance)} />
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No balances yet.</p>
          )}
        </Card>
      )}

      {tab === 'Settle up' && (
        <Card title="Simplest way to settle up">
          <p className="text-sm text-muted mb-3">
            These are the fewest transactions needed to clear every balance in this group.
          </p>
          {balances?.settle_up_plan?.length ? (
            <div className="divide-y divide-line">
              {balances.settle_up_plan.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar name={t.from.name} color={t.from.avatar_color} size={28} />
                    <span className="text-ink font-medium">{t.from.name}</span>
                    <span className="text-muted">pays</span>
                    <Avatar name={t.to.name} color={t.to.avatar_color} size={28} />
                    <span className="text-ink font-medium">{t.to.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-ink">₹{t.amount.toFixed(2)}</span>
                    {user.id === t.from.id && (
                      <Button variant="secondary" onClick={() => handleSettleUp(t.from.id, t.to.id, t.amount)}>
                        Mark as paid
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">Everyone's settled up. 🎉</p>
          )}
        </Card>
      )}

      {tab === 'Members' && (
        <Card title="Members">
          <div className="divide-y divide-line mb-4">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3">
                <Avatar name={m.name} color={m.avatar_color} size={32} />
                <span className="text-ink">{m.name}</span>
                <span className="text-sm text-muted">{m.email}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              placeholder="Add member by email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Add</Button>
          </form>
          {inviteError && <p className="text-sm text-debit mt-2">{inviteError}</p>}
        </Card>
      )}

      {showAddExpense && (
        <AddExpenseModal
          members={members}
          groupId={id}
          currentUserId={user.id}
          onClose={() => setShowAddExpense(false)}
          onCreated={loadAll}
        />
      )}
    </div>
  );
}
