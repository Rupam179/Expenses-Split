import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/services';
import Card from '../components/Card';
import LedgerRow from '../components/LedgerRow';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMySummary(), api.getMyGroups()])
      .then(([summaryRes, groupsRes]) => {
        setSummary(summaryRes.data);
        setGroups(groupsRes.data.groups);
      })
      .catch(() => setError('Could not load your dashboard. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center text-muted mt-16">Adding up your ledger…</p>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-muted mt-1">Here's where things stand across all your groups and friends.</p>
      </div>

      {error && <p className="text-debit">{error}</p>}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <p className="text-sm text-muted mb-1">You are owed</p>
            <p className="font-mono text-3xl font-semibold text-credit">₹{summary.you_are_owed.toFixed(2)}</p>
          </Card>
          <Card>
            <p className="text-sm text-muted mb-1">You owe</p>
            <p className="font-mono text-3xl font-semibold text-debit">₹{summary.you_owe.toFixed(2)}</p>
          </Card>
        </div>
      )}

      <Card
        title="Balances with friends"
        action={
          <Link to="/friends" className="text-sm font-medium text-primary">
            View all
          </Link>
        }
      >
        {summary?.friends?.length ? (
          <div className="divide-y divide-line">
            {summary.friends.slice(0, 5).map((f) => (
              <LedgerRow key={f.id} name={f.name} color={f.avatar_color} amount={Number(f.net_with_friend)} />
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm py-2">No open balances with friends yet — you're all settled up.</p>
        )}
      </Card>

      <Card
        title="Your groups"
        action={
          <Link to="/groups" className="text-sm font-medium text-primary">
            View all
          </Link>
        }
      >
        {groups.length ? (
          <div className="divide-y divide-line">
            {groups.slice(0, 5).map((g) => (
              <Link
                key={g.id}
                to={`/groups/${g.id}`}
                className="flex items-center justify-between py-3 hover:bg-ledger/40 -mx-5 px-5 transition-colors"
              >
                <span className="text-ink font-medium">{g.name}</span>
                <span className="text-sm text-muted">{g.member_count} members</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm py-2">
            You're not in any groups yet.{' '}
            <Link to="/groups" className="text-primary font-medium">
              Create one
            </Link>
            .
          </p>
        )}
      </Card>
    </div>
  );
}
