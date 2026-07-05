import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('tally_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tally_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('tally_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('tally_token');
        localStorage.removeItem('tally_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginUser = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('tally_token', res.data.token);
    localStorage.setItem('tally_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const signupUser = async (name, email, password) => {
    const res = await api.signup({ name, email, password });
    localStorage.setItem('tally_token', res.data.token);
    localStorage.setItem('tally_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('tally_token');
    localStorage.removeItem('tally_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, signupUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
