import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary text-white' : 'text-ink hover:bg-ledger'
    }`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-10 bg-white border-b border-line">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="font-display text-2xl text-primary-dark tracking-tight">
            Expenses Split
          </NavLink>
          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/" className={linkClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/groups" className={linkClass}>
              Groups
            </NavLink>
            <NavLink to="/friends" className={linkClass}>
              Friends
            </NavLink>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted">{user.name}</span>
            <Avatar name={user.name} color={user.avatar_color} size={32} />
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-muted hover:text-debit transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
      <div className="sm:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        <NavLink to="/" className={linkClass} end>
          Dashboard
        </NavLink>
        <NavLink to="/groups" className={linkClass}>
          Groups
        </NavLink>
        <NavLink to="/friends" className={linkClass}>
          Friends
        </NavLink>
      </div>
    </nav>
  );
}
