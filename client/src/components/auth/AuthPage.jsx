import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage({ onAuthSuccess }) {
  const { login } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      if (login) {
        await login(email, password);
      }
      setSuccessMsg('Login successful! Redirecting...');
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
        err.message ||
        'Invalid credentials. Please verify your email and password.'
      );
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
          <p className="auth-subtitle">Footwear Warehouse &amp; Billing Management System</p>
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

        {/* SIGN IN FORM (Registration UI completely removed) */}
        <form className="auth-form" onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter admin email"
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
                placeholder="Enter password"
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
        </form>
      </div>
    </div>
  );
}
