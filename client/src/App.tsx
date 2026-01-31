/**
 * Main App Component
 */

import { useState, useEffect, useMemo } from 'react';
import { PhotoUpload } from './components/PhotoUpload';
import { FeedPage } from './pages/FeedPage';
import { ProfilePage } from './pages/ProfilePage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ThemeToggle } from './components/ThemeToggle';
import { Logo } from './components/Logo';
import { apiUrl } from './config/api';
import './styles/design-system.css';
import './App.css';

function App() {
  const [path, setPath] = useState(() => window.location.pathname || '/');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [activeView, setActiveView] = useState<'feed' | 'upload'>('feed');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch current username for "My Profile" button
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(apiUrl('api/v1/auth/me'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data.success) {
          const username = data.data?.username;
          if (username) {
            setCurrentUsername(username);
          }
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };

    fetchCurrentUser();
  }, [isAuthenticated]);

  // Navigate function for client-side routing
  const navigate = (to: string) => {
    if (to === path) return;
    window.history.pushState({}, '', to);
    setPath(to);
  };

  // Check for verify-email route
  const isVerifyEmailRoute = useMemo(() => {
    return path === '/verify-email' || path.startsWith('/verify-email?');
  }, [path]);

  // Match profile routes
  const profileUsername = useMemo(() => {
    const match = path.match(/^\/profile\/([^/]+)\/?$/);
    if (!match) return null;
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }, [path]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const response = await fetch(apiUrl('api/v1/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.data.token);
        setIsAuthenticated(true);
        setEmail('');
        setPassword('');
      } else {
        setLoginError(data.error?.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setLoginError('Network error. Please check your connection.');
      console.error('Login error:', err);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const response = await fetch(apiUrl('api/v1/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRegistrationSuccess(true);
        setVerificationEmailSent(email);
        setEmail('');
        setUsername('');
        setPassword('');
        setDisplayName('');
      } else {
        setLoginError(data.error?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setLoginError('Network error. Please check your connection.');
      console.error('Registration error:', err);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmailSent) return;

    try {
      const response = await fetch(apiUrl('api/v1/auth/resend-verification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verificationEmailSent }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoginError('');
        alert('Verification email sent! Please check your inbox.');
      } else {
        setLoginError(data.error?.message || 'Failed to resend verification email.');
      }
    } catch (err) {
      setLoginError('Network error. Please check your connection.');
      console.error('Resend verification error:', err);
    }
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setLoginError('');
    setRegistrationSuccess(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentUsername(null);
    navigate('/');
  };

  // Render verify-email page (public route)
  if (isVerifyEmailRoute) {
    return <VerifyEmailPage onNavigate={navigate} />;
  }

  // Render profile page if on profile route
  if (profileUsername) {
    return <ProfilePage username={profileUsername} onNavigate={navigate} />;
  }

  if (!isAuthenticated) {
    // Show success message after registration
    if (registrationSuccess) {
      return (
        <div className="app-container">
          <div className="login-container">
            <Logo size="large" />
            <p className="subtitle">Check your email</p>

            <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'block', textAlign: 'left' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span className="alert-icon">✉️</span>
                <strong>Check your email</strong>
              </div>
              <p style={{ margin: 0, lineHeight: '1.6' }}>
                We've sent a verification link to <strong>{verificationEmailSent}</strong>. Please check your inbox and click the link to verify your account.
              </p>
            </div>

            <p className="hint-text">
              Didn't receive the email?
              <br />
              <button
                onClick={handleResendVerification}
                className="btn btn-secondary"
                style={{ marginTop: '1rem' }}
              >
                Resend Verification Email
              </button>
            </p>

            <button
              onClick={() => {
                setRegistrationSuccess(false);
                setAuthMode('login');
              }}
              className="btn btn-primary btn-block"
              style={{ marginTop: '1rem' }}
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
          <p className="subtitle">
            {authMode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="login-form">
            {authMode === 'register' && (
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loggingIn}
                  className="form-input"
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                  title="Username must contain only letters, numbers, and underscores"
                />
              </div>
            )}

            <div className="form-group">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loggingIn}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loggingIn}
                className="form-input"
                minLength={authMode === 'register' ? 8 : undefined}
              />
            </div>

            {loginError && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                {loginError}
              </div>
            )}

            <button type="submit" disabled={loggingIn} className="btn btn-primary btn-block">
              {loggingIn ? (authMode === 'login' ? 'Logging in...' : 'Creating account...') : (authMode === 'login' ? 'Log In' : 'Sign Up')}
            </button>
          </form>

          <p className="hint-text">
            {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={switchAuthMode}
              className="btn btn-secondary"
              style={{ marginTop: '0.5rem' }}
            >
              {authMode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header-content">
          <Logo size="medium" className="app-logo" />
          <nav className="app-nav">
            <button
              onClick={() => setActiveView('feed')}
              className={`btn btn-sm ${activeView === 'feed' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveView('upload')}
              className={`btn btn-sm ${activeView === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Upload
            </button>
            {currentUsername && (
              <button
                onClick={() => navigate(`/profile/${currentUsername}`)}
                className="btn btn-secondary btn-sm"
              >
                My Profile
              </button>
            )}
            <ThemeToggle />
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Log Out
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {activeView === 'feed' ? <FeedPage onNavigate={navigate} /> : <PhotoUpload />}
      </main>
    </div>
  );
}

export default App;
