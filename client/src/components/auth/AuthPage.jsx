import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage({ onAuthSuccess }) {
  const { login, register } = useAuth();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);

  // Status message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Switch view helper with clean error clearing
  const switchView = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      setSuccessMsg('Login successful! Redirecting...');
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-check.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, role);
      setSuccessMsg('Account registered successfully! Welcome.');
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Terminal / Brand Header */}
        <div className="auth-header">
          <div className="auth-brand-badge">[ SYSTEM ACCESS ]</div>
          <h1 className="auth-title">AS MARKETING</h1>
          <p className="auth-subtitle">Footwear Warehouse & Billing Management System</p>
        </div>

        {/* Tab Selector (Login / Register) */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchView('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchView('register')}
          >
            Create Account
          </button>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="auth-alert auth-alert-danger">
            <span className="auth-alert-icon">&#9888;</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert auth-alert-success">
            <span className="auth-alert-icon">&#10004;</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* 1. LOGIN FORM */}
        {/* ================================================================= */}
        {mode === 'login' && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="admin@asmarketing.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-auth-primary" disabled={loading}>
              {loading ? (
                <span className="btn-spinner-text">Authenticating...</span>
              ) : (
                'Secure Sign In'
              )}
            </button>

            <div className="auth-footer-text">
              Don't have an account?{' '}
              <button
                type="button"
                className="auth-link-text"
                onClick={() => switchView('register')}
              >
                Register here
              </button>
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* 2. REGISTER FORM */}
        {/* ================================================================= */}
        {mode === 'register' && (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Muhammad Shifan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="shifan@asmarketing.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Role / Access Level</label>
              <select
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">Administrator (Full Access)</option>
                <option value="manager">Warehouse Manager</option>
                <option value="staff">Billing Staff</option>
              </select>
            </div>

            <button type="submit" className="btn-auth-primary" disabled={loading}>
              {loading ? (
                <span className="btn-spinner-text">Creating Account...</span>
              ) : (
                'Create User Account'
              )}
            </button>

            <div className="auth-footer-text">
              Already registered?{' '}
              <button
                type="button"
                className="auth-link-text"
                onClick={() => switchView('login')}
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
