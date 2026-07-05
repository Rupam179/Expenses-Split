import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await loginUser(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-primary-dark">Expenses Split</h1>
          <p className="text-muted mt-2">Split expenses without the awkwardness.</p>
        </div>
        <div className="bg-white border border-line rounded-xl p-6">
          <h2 className="font-display text-xl text-ink mb-4">Log in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-debit">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log in'}
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-muted mt-4">
          New here?{' '}
          <Link to="/signup" className="text-primary font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
