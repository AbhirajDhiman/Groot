import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../authContext';
import { API_BASE_URL } from '../../config/api';
import { Button } from '../ui';
import { Input } from '../ui';
import './auth.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setCurrentUser } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/signup`, {
        email: email,
        password: password,
        username: username,
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);

      setCurrentUser(res.data.userId);
      setLoading(false);

      window.location.href = '/';
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.error || 'Signup failed. Please check your details.';
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
        <h1 className="auth-card__title">Create your account</h1>

        {error && (
          <div className="auth-card__error" role="alert">
            <AlertCircle size={16} className="auth-card__error-icon" aria-hidden="true" />
            {error}
          </div>
        )}

        <form className="auth-card__form" onSubmit={handleSignup} noValidate>
          <Input
            label="Username"
            id="Username"
            name="Username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            mono
          />

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <div className="auth-card__submit">
            <Button type="submit" full loading={loading} disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="auth-footer">
        Already have an account?{' '}
        <Link to="/auth">Sign in</Link>
      </div>
    </div>
  );
};

export default Signup;
