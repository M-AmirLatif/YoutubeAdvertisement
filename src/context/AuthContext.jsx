import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken as persistToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  function setToken(tokenValue) {
    persistToken(tokenValue);
    setTokenState(tokenValue);
  }

  async function refreshUser() {
    if (!getToken()) {
      setUser(null);
      return null;
    }
    const data = await api('/auth/me');
    setUser(data.user);
    return data.user;
  }

  async function login(payload) {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    setToken(data.token);
    setUser(data.user);
  }

  async function signup(payload) {
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        await refreshUser();
      } catch {
        logout();
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ token, user, setUser, loading, login, signup, logout, refreshUser }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
