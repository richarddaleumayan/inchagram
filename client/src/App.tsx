/**
 * Main App Component
 */

import { useState, useEffect, useMemo } from 'react';
import { PhotoUpload } from './components/PhotoUpload';
import { ProfilePage } from './components/ProfilePage';
import './App.css';

function App() {
  const [path, setPath] = useState(() => window.location.pathname || '/');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
    const storedUsername = localStorage.getItem('authUsername');
    if (storedUsername) {
      setCurrentUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (response.ok && data.success) {
          const username = data.data?.username;
          if (username) {
            setCurrentUsername(username);
            localStorage.setItem('authUsername', username);
          }
        } else if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUsername');
          setIsAuthenticated(false);
          setCurrentUsername(null);
        }
      } catch (err) {
        console.error('Auth check error:', err);
      }
    };

    fetchCurrentUser();
  }, [isAuthenticated]);

  const profileUsername = useMemo(() => {
    const match = path.match(/^\/profile\/([^/]+)\/?$/);
    if (!match) {
      return null;
    }
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }, [path]);

  const navigate = (to: string) => {
    if (to === path) {
      return;
    }
    window.history.pushState({}, '', to);
    setPath(to);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('authToken', data.data.token);
        const username = data.data?.user?.username;
        if (username) {
          setCurrentUsername(username);
          localStorage.setItem('authUsername', username);
        }
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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUsername');
    setIsAuthenticated(false);
    setCurrentUsername(null);
    navigate('/');
  };

  if (profileUsername) {
    return (
      <div className="app-container">
        <header className="app-header">
          <button
            type="button"
            className="brand-button"
            onClick={() => navigate('/')}
          >
            inchagram
          </button>
          <div className="header-actions">
            {currentUsername && (
              <button
                onClick={() => navigate(`/profile/${currentUsername}`)}
                className="btn btn-secondary btn-sm"
              >
                My Profile
              </button>
            )}
            {isAuthenticated ? (
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Log Out
              </button>
            ) : (
              <button onClick={() => navigate('/')} className="btn btn-secondary btn-sm">
                Log In
              </button>
            )}
          </div>
        </header>

        <main className="app-main">
          <ProfilePage username={profileUsername} onNavigate={navigate} />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="login-container">
          <h1>inchagram</h1>
          <p className="subtitle">Photo sharing made simple</p>

          <form onSubmit={handleLogin} className="login-form">
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
              />
            </div>

            {loginError && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                {loginError}
              </div>
            )}

            <button type="submit" disabled={loggingIn} className="btn btn-primary btn-block">
              {loggingIn ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="hint-text">
            Note: You need an existing account to log in.
            <br />
            Create an account via the API or use test credentials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>inchagram</h1>
        <div className="header-actions">
          {currentUsername && (
            <button
              onClick={() => navigate(`/profile/${currentUsername}`)}
              className="btn btn-secondary btn-sm"
            >
              My Profile
            </button>
          )}
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            Log Out
          </button>
        </div>
      </header>

      <main className="app-main">
        <PhotoUpload />
      </main>
    </div>
  );
}

export default App;
