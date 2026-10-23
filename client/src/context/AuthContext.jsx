import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on app load
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('as_auth_token');
        const storedUser = localStorage.getItem('as_auth_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
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

  // Login handler via backend API
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

  // Register handler (disabled)
  const register = async () => {
    throw new Error('Registration is currently disabled. Please sign in as admin.');
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
