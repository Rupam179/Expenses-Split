import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/services';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';

const GROUP_TYPES = [
  ['home', 'Home / Roommates'],
  ['trip', 'Trip'],
  ['couple', 'Couple'],
  ['other', 'Other'],
];

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState('other');
  const [memberEmails, setMemberEmails] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadGroups = () => {
    api
      .getMyGroups()
      .then((res) => setGroups(res.data.groups))
      .catch(() => setError('Could not load your groups.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadGroups, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Give your group a name.');

    setSubmitting(true);
    try {
      const emails = memberEmails
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      let memberIds = [];
      for (const email of emails) {
        const res = await api.searchUsers(email);
        const match = res.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (match) memberIds.push(match.id);
      }

      await api.createGroup({ name: name.trim(), group_type: groupType, member_ids: memberIds });
      setName('');
      setMemberEmails('');
      setShowForm(false);
      loadGroups();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the group.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Groups</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : '+ New group'}</Button>
      </div>

      {showForm && (
        <Card title="Create a group">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Group name" placeholder="e.g. Goa Trip 2026" value={name} onChange={(e) => setName(e.target.value)} />
            <label className="block">
              <span className="block text-sm font-medium text-ink mb-1">Type</span>
              <select
                value={groupType}
                onChange={(e) => setGroupType(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink"
              >
                {GROUP_TYPES.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Invite members (comma-separated emails, optional)"
              placeholder="alex@example.com, sam@example.com"
              value={memberEmails}
              onChange={(e) => setMemberEmails(e.target.value)}
            />
            <p className="text-xs text-muted">
              Only members who already have a Tally account will be added automatically. You can add more later.
            </p>
            {error && <p className="text-sm text-debit">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create group'}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-muted">Loading groups…</p>
      ) : groups.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((g) => (
            <Link key={g.id} to={`/groups/${g.id}`}>
              <Card className="hover:border-primary transition-colors h-full">
                <div className="flex items-center gap-3">
                  <Avatar name={g.name} size={40} />
                  <div>
                    <p className="font-display text-lg text-ink">{g.name}</p>
                    <p className="text-sm text-muted">{g.member_count} members</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted">You haven't created any groups yet.</p>
      )}
    </div>
  );
}
