import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('as_auth_token');
        const storedUser = localStorage.getItem('as_auth_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Optionally verify token freshness in background
          try {
            const res = await authApi.getMe();
            if (res.data?.user) {
              setUser(res.data.user);
              localStorage.setItem('as_auth_user', JSON.stringify(res.data.user));
            }
          } catch (err) {
            console.warn('Session verification fallback:', err.message);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        localStorage.removeItem('as_auth_token');
        localStorage.removeItem('as_auth_user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data?.success && res.data?.token) {
      const authToken = res.data.token;
      const authUser = res.data.user;

      setToken(authToken);
      setUser(authUser);

      localStorage.setItem('as_auth_token', authToken);
      localStorage.setItem('as_auth_user', JSON.stringify(authUser));

      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  // Register handler
  const register = async (name, email, password, role = 'admin') => {
    const res = await authApi.register({ name, email, password, role });
    if (res.data?.success && res.data?.token) {
      const authToken = res.data.token;
      const authUser = res.data.user;

      setToken(authToken);
      setUser(authUser);

      localStorage.setItem('as_auth_token', authToken);
      localStorage.setItem('as_auth_user', JSON.stringify(authUser));

      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('as_auth_token');
    localStorage.removeItem('as_auth_user');
  };

  // Helper to update credentials directly (e.g. after reset password)
  const setAuthData = (authUser, authToken) => {
    setUser(authUser);
    setToken(authToken);
    if (authToken) localStorage.setItem('as_auth_token', authToken);
    if (authUser) localStorage.setItem('as_auth_user', JSON.stringify(authUser));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    setAuthData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
