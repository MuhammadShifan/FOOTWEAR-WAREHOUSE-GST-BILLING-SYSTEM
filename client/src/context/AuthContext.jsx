import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Login handler using environment variables (database-based auth disabled)
  const login = async (email, password) => {
    // Read admin credentials from environment variables
    // Supports Vite (VITE_ADMIN_*) and Create React App (REACT_APP_ADMIN_*)
    const adminEmail =
      import.meta.env.VITE_ADMIN_EMAIL ||
      (typeof process !== 'undefined' && process.env?.REACT_APP_ADMIN_EMAIL) ||
      '';
    const adminPassword =
      import.meta.env.VITE_ADMIN_PASSWORD ||
      (typeof process !== 'undefined' && process.env?.REACT_APP_ADMIN_PASSWORD) ||
      '';

    // Validate credentials against .env
    const isEmailValid =
      adminEmail && email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
    const isPasswordValid = adminPassword && password === adminPassword;

    if (isEmailValid && isPasswordValid) {
      const adminUser = {
        name: 'Administrator',
        email: adminEmail,
        role: 'admin',
      };
      const authToken = 'as_admin_env_session_token';

      setToken(authToken);
      setUser(adminUser);

      localStorage.setItem('as_auth_token', authToken);
      localStorage.setItem('as_auth_user', JSON.stringify(adminUser));

      return { success: true, user: adminUser, token: authToken };
    }

    throw new Error('Invalid credentials');
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
