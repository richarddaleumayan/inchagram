/**
 * VerifyEmailPage Component
 * Handles email verification when user clicks link from email
 */

import { useEffect, useState } from 'react';
import { apiUrl } from '../config/api';

interface VerifyEmailPageProps {
  onNavigate: (to: string) => void;
}

export function VerifyEmailPage({ onNavigate }: VerifyEmailPageProps) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Get token from URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch(`/api/v1/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error?.message || 'Verification failed. The link may be invalid or expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error. Please try again.');
        console.error('Verification error:', err);
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="app-container">
      <div className="login-container">
        <h1>inchagram</h1>
        <p className="subtitle">Email Verification</p>

        {status === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div className="profile-spinner" />
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
              Verifying your email...
            </p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
              <span className="alert-icon">✓</span>
              {message}
            </div>
            <button
              onClick={() => onNavigate('/')}
              className="btn btn-primary btn-block"
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              <span className="alert-icon">⚠️</span>
              {message}
            </div>
            <button
              onClick={() => onNavigate('/')}
              className="btn btn-primary btn-block"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
