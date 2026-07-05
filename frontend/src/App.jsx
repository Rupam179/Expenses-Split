import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Friends from './pages/Friends';
import FriendDetail from './pages/FriendDetail';
import AddFriend from './pages/AddFriend';
import { useAuth } from './context/AuthContext';

function Layout({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-paper">
      {user && <Navbar />}
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <Groups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:id"
          element={
            <ProtectedRoute>
              <GroupDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends/add"
          element={
            <ProtectedRoute>
              <AddFriend />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends/:id"
          element={
            <ProtectedRoute>
              <FriendDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}
