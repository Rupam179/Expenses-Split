import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/services';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';

export default function AddFriend() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const res = await api.searchUsers(query.trim());
    setResults(res.data.users);
    setSearched(true);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="font-display text-3xl text-ink">Find a friend</h1>
      <Card>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </form>
      </Card>
      {searched && (
        <Card title="Results">
          {results.length ? (
            <div className="divide-y divide-line">
              {results.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} color={u.avatar_color} size={32} />
                    <div>
                      <p className="text-ink font-medium">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => navigate(`/friends/${u.id}`)}>
                    Start splitting
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No matching users found.</p>
          )}
        </Card>
      )}
    </div>
  );
}
