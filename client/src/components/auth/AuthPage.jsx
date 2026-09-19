import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export default function AuthPage({ onAuthSuccess }) {
  const { login, register, setAuthData } = useAuth();

  // Mode: 'login' | 'register' | 'forgot' | 'verify_otp' | 'reset_password'
  const [mode, setMode] = useState('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);

  // OTP 6-box state
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  // Timers & Feedback states
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 10-minute Countdown Timer Effect for OTP
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      setErrorMsg('OTP code has expired. Please request a new OTP code.');
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

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
      setErrorMsg(err.response?.data?.message || err.message || 'Login failed.');
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

  // Handle Forgot Password - Request 6-digit OTP
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setSuccessMsg(res.data?.message || 'A 6-digit OTP code has been sent to your email.');
      // Start 10-minute timer and cooldown
      setTimeLeft(600);
      setTimerActive(true);
      setResendCooldown(60);
      setOtpValues(['', '', '', '', '', '']);
      setMode('verify_otp');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to generate OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP 6-box input changes
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = cleaned;
    setOtpValues(newOtp);

    // Auto-advance to next input if digit entered
    if (cleaned && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  // Handle OTP backspace navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      if (otpInputRefs.current[index - 1]) {
        otpInputRefs.current[index - 1].focus();
      }
    }
  };

  // Handle OTP Paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData) {
      const digits = pastedData.slice(0, 6).split('');
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtpValues(newOtp);

      const nextFocus = Math.min(digits.length, 5);
      if (otpInputRefs.current[nextFocus]) {
        otpInputRefs.current[nextFocus].focus();
      }
    }
  };

  // Handle Verify OTP
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ email, otp: fullOtp });
      setSuccessMsg(res.data?.message || 'OTP verified! Set your new password.');
      setMode('reset_password');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setSuccessMsg('A new 6-digit OTP has been sent to your email.');
      setTimeLeft(600);
      setTimerActive(true);
      setResendCooldown(60);
      setOtpValues(['', '', '', '', '', '']);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Missing verified OTP. Please restart verification.');
      setMode('forgot');
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMsg('Please enter and confirm your new password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({
        email,
        otp: fullOtp,
        newPassword: password,
      });

      setSuccessMsg(res.data?.message || 'Password reset successfully!');

      // If backend issued token, authenticate directly
      if (res.data?.token && res.data?.user) {
        setAuthData(res.data.user, res.data.token);
        if (onAuthSuccess) onAuthSuccess();
      } else {
        setTimeout(() => {
          switchView('login');
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to reset password.');
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

        {/* Tab Selector (for Login / Register) */}
        {(mode === 'login' || mode === 'register') && (
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
        )}

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
              <div className="form-label-row">
                <label className="form-label">Password</label>
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => switchView('forgot')}
                >
                  Forgot Password?
                </button>
              </div>
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

        {/* ================================================================= */}
        {/* 3. FORGOT PASSWORD - REQUEST OTP */}
        {/* ================================================================= */}
        {mode === 'forgot' && (
          <form className="auth-form" onSubmit={handleForgotSubmit}>
            <div className="auth-view-header">
              <h2 className="auth-view-title">Password Recovery</h2>
              <p className="auth-view-desc">
                Enter your registered email. We will dispatch a 6-digit OTP verification code valid for 10 minutes.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="your.email@asmarketing.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="btn-auth-primary" disabled={loading}>
              {loading ? (
                <span className="btn-spinner-text">Sending OTP...</span>
              ) : (
                'Send 6-Digit OTP Code'
              )}
            </button>

            <div className="auth-footer-text">
              <button
                type="button"
                className="auth-link-text"
                onClick={() => switchView('login')}
              >
                &larr; Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* 4. OTP VERIFICATION SCREEN */}
        {/* ================================================================= */}
        {mode === 'verify_otp' && (
          <form className="auth-form" onSubmit={handleVerifyOtpSubmit}>
            <div className="auth-view-header">
              <h2 className="auth-view-title">Verify 6-Digit OTP</h2>
              <p className="auth-view-desc">
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>
            </div>

            {/* Segmented 6-Box OTP Input */}
            <div className="otp-container" onPaste={handleOtpPaste}>
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="otp-box"
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Expiry Timer & Resend Controls */}
            <div className="otp-timer-row">
              <div className="otp-timer-badge">
                <span className="timer-icon">&#9201;</span>
                <span>
                  Code expires in: <strong>{formatTime(timeLeft)}</strong>
                </span>
              </div>

              <button
                type="button"
                className="btn-resend-otp"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <button
              type="submit"
              className="btn-auth-primary"
              disabled={loading || otpValues.join('').length !== 6 || timeLeft === 0}
            >
              {loading ? (
                <span className="btn-spinner-text">Verifying Code...</span>
              ) : (
                'Verify OTP & Continue'
              )}
            </button>

            <div className="auth-footer-text">
              <button
                type="button"
                className="auth-link-text"
                onClick={() => switchView('forgot')}
              >
                Change Email / Restart
              </button>
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* 5. RESET PASSWORD FORM */}
        {/* ================================================================= */}
        {mode === 'reset_password' && (
          <form className="auth-form" onSubmit={handleResetPasswordSubmit}>
            <div className="auth-view-header">
              <h2 className="auth-view-title">Create New Password</h2>
              <p className="auth-view-desc">
                Identity verified for <strong>{email}</strong>. Enter your new secure password below.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter new password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Password Match / Strength Helper */}
            {password && (
              <div className="password-hints">
                <span className={password.length >= 6 ? 'hint-valid' : 'hint-invalid'}>
                  {password.length >= 6 ? '&#10004; At least 6 characters' : '&#10006; Minimum 6 characters required'}
                </span>
                {confirmPassword && (
                  <span className={password === confirmPassword ? 'hint-valid' : 'hint-invalid'}>
                    {password === confirmPassword ? '&#10004; Passwords match' : '&#10006; Passwords do not match'}
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn-auth-primary"
              disabled={loading || password.length < 6 || password !== confirmPassword}
            >
              {loading ? (
                <span className="btn-spinner-text">Updating Password...</span>
              ) : (
                'Reset Password & Sign In'
              )}
            </button>

            <div className="auth-footer-text">
              <button
                type="button"
                className="auth-link-text"
                onClick={() => switchView('login')}
              >
                &larr; Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
