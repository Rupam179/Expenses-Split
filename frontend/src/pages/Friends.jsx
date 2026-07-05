import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/services';
import Card from '../components/Card';
import Button from '../components/Button';
import LedgerRow from '../components/LedgerRow';

export default function Friends() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMySummary()
      .then((res) => setSummary(res.data))
      .catch(() => setError('Could not load your friends.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-muted mt-16">Loading friends…</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Friends</h1>
        <Link to="/friends/add">
          <Button>+ Find a friend</Button>
        </Link>
      </div>
      {error && <p className="text-debit">{error}</p>}
      <Card>
        {summary?.friends?.length ? (
          <div className="divide-y divide-line">
            {summary.friends.map((f) => (
              <Link key={f.id} to={`/friends/${f.id}`} className="block hover:bg-ledger/40 -mx-5 px-5 transition-colors">
                <LedgerRow name={f.name} color={f.avatar_color} amount={Number(f.net_with_friend)} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm py-2">
            No shared expenses with friends yet. Add an expense in a group to see balances here.
          </p>
        )}
      </Card>
    </div>
  );
}
