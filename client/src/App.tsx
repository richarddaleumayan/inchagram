/**
 * Main App Component
 */

import { useState, useEffect } from 'react';
import { PhotoUpload } from './components/PhotoUpload';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

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
    setIsAuthenticated(false);
  };

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
        <button onClick={handleLogout} className="btn btn-secondary btn-sm">
          Log Out
        </button>
      </header>

      <main className="app-main">
        <PhotoUpload />
      </main>
    </div>
  );
}

export default App;
