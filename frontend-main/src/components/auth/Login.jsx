import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../authContext';
import { API_BASE_URL } from '../../config/api';
import { Button } from '../ui';
import { Input } from '../ui';
import './auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setCurrentUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/login`, {
        email: email,
        password: password,
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);

      setCurrentUser(res.data.userId);
      setLoading(false);

      window.location.href = '/';
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Brand */}
      <Link to="/auth" className="auth-page__brand" aria-label="Groot home">
        <GitBranch className="auth-page__brand-icon" aria-hidden="true" />
        <span className="auth-page__brand-name">groot</span>
      </Link>

      {/* Main card */}
      <div className="auth-card">
        <h1 className="auth-card__title">Sign in to Groot</h1>

        {error && (
          <div className="auth-card__error" role="alert">
            <AlertCircle size={16} className="auth-card__error-icon" aria-hidden="true" />
            {error}
          </div>
        )}

        <form className="auth-card__form" onSubmit={handleLogin} noValidate>
          <Input
            label="Email address"
            id="Email"
            name="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            label="Password"
            id="Password"
            name="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <div className="auth-card__submit">
            <Button type="submit" full loading={loading} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="auth-footer">
        New to Groot?{' '}
        <Link to="/signup">Create an account</Link>
      </div>
    </div>
  );
};

export default Login;
