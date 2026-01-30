/**
 * Main App Component
 */

import { useState, useEffect, useMemo } from 'react';
import { PhotoUpload } from './components/PhotoUpload';
import { FeedPage } from './pages/FeedPage';
import { ProfilePage } from './pages/ProfilePage';
import { ThemeToggle } from './components/ThemeToggle';
import './styles/design-system.css';
import './App.css';

function App() {
  const [path, setPath] = useState(() => window.location.pathname || '/');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [activeView, setActiveView] = useState<'feed' | 'upload'>('feed');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

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
        const response = await fetch('/api/v1/auth/me', {
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

  // Navigate function for client-side routing
  const navigate = (to: string) => {
    if (to === path) return;
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentUsername(null);
    navigate('/');
  };

  // Render profile page if on profile route
  if (profileUsername) {
    return <ProfilePage username={profileUsername} onNavigate={navigate} />;
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
        <div className="app-header-content">
          <h1 className="app-logo">inchagram</h1>
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
