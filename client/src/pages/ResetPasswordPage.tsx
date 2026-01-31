/**
 * Reset Password Page
 * Allows users to set a new password with a reset token
 */

import { useState, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { apiUrl } from '../config/api';

interface ResetPasswordPageProps {
  onNavigate: (path: string) => void;
}

export function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract token from URL query params
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiUrl('api/v1/auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error?.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="app-container">
        <div className="login-container">
          <Logo size="large" />
          <p className="subtitle">Password reset successful!</p>

          <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'block', textAlign: 'left' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="alert-icon">✅</span>
              <strong>All set!</strong>
            </div>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              Your password has been reset successfully. You can now log in with your new password.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/')}
            className="btn btn-primary btn-block"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="login-container">
        <Logo size="large" />
        <p className="subtitle">Set new password</p>

        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || !token}
              className="form-input"
              minLength={8}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading || !token}
              className="form-input"
              minLength={8}
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !token} className="btn btn-primary btn-block">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="hint-text">
          Remember your password?
          <button
            onClick={() => onNavigate('/')}
            className="btn btn-secondary"
            style={{ marginTop: '0.5rem' }}
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
}
