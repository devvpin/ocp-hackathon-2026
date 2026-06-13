import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/auth';
import { setToken, getToken, setUserData, clearAuth } from '../utils/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi
        .getCurrentUser()
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          clearAuth();
          setTokenState(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUserData(userData);
    setTokenState(newToken);
    setUser(userData);
    return userData;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const res = await authApi.signup(name, email, password);
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUserData(userData);
    setTokenState(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout should still succeed if the token is already invalid.
    }
    clearAuth();
    localStorage.clear();
    sessionStorage.clear();
    setTokenState(null);
    setUser(null);
  }, []);

  const revalidate = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) {
      clearAuth();
      setTokenState(null);
      setUser(null);
      throw new Error('No token');
    }
    try {
      const res = await authApi.getCurrentUser();
      setUser(res.data.user);
    } catch {
      clearAuth();
      setTokenState(null);
      setUser(null);
      throw new Error('Token invalid');
    }
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated, isAdmin, login, signup, logout, revalidate }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
