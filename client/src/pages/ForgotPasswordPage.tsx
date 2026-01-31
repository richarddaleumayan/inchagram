/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */

import { useState } from 'react';
import { Logo } from '../components/Logo';
import { apiUrl } from '../config/api';

interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('api/v1/auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error?.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="app-container">
        <div className="login-container">
          <Logo size="large" />
          <p className="subtitle">Check your email</p>

          <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'block', textAlign: 'left' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="alert-icon">✉️</span>
              <strong>Email sent</strong>
            </div>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly. Please check your inbox.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/')}
            className="btn btn-primary btn-block"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="login-container">
        <Logo size="large" />
        <p className="subtitle">Reset your password</p>

        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Sending...' : 'Send Reset Link'}
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
