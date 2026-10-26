import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe, Lock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import PageLayout from '../PageLayout';
import { Button } from '../ui';
import { Input, Textarea } from '../ui';
import './dashboard.css';
import './CreateRepo.css';

const CreateRepo = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState(true);   // true = public
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Repository name is required.');
      return;
    }

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (!userId) {
      navigate('/auth');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/repo/create`,
        {
          name: name.trim(),
          description: description.trim(),
          visibility: visibility,
          owner: userId,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setLoading(false);
      navigate('/');
    } catch (err) {
      console.error('Error creating repository:', err);
      const msg = err.response?.data?.error || 'Failed to create repository.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <PageLayout narrow>
      <div className="create-repo__header">
        <h1 className="create-repo__title">Create a new repository</h1>
        <p className="create-repo__subtitle">
          A repository contains all project files, including the revision history.
        </p>
      </div>

      <div className="create-repo__card">
        {error && (
          <div className="create-repo__error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        <form className="create-repo__form" onSubmit={handleCreate} noValidate>
          <Input
            label="Repository name"
            id="repo-name"
            name="repo-name"
            type="text"
            placeholder="e.g. my-awesome-project"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            mono
            hint="Use lowercase letters, numbers, and hyphens."
          />

          <div className="create-repo__divider" role="separator" />

          <Textarea
            label="Description"
            id="repo-description"
            name="repo-description"
            placeholder="Brief description of your repository (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
          />

          <div className="create-repo__divider" role="separator" />

          {/* Visibility — selectable cards */}
          <fieldset style={{ border: 'none', padding: 0 }}>
            <legend className="visibility-label">Visibility</legend>
            <div className="visibility-options">
              {/* Public */}
              <label
                className={`visibility-option${visibility === true ? ' visibility-option--selected' : ''}`}
                htmlFor="vis-public"
              >
                <input
                  type="radio"
                  id="vis-public"
                  name="visibility"
                  value="public"
                  checked={visibility === true}
                  onChange={() => setVisibility(true)}
                  disabled={loading}
                />
                <Globe className="visibility-option__icon" aria-hidden="true" />
                <span className="visibility-option__title">Public</span>
                <span className="visibility-option__desc">
                  Anyone can see this repository.
                </span>
              </label>

              {/* Private */}
              <label
                className={`visibility-option${visibility === false ? ' visibility-option--selected' : ''}`}
                htmlFor="vis-private"
              >
                <input
                  type="radio"
                  id="vis-private"
                  name="visibility"
                  value="private"
                  checked={visibility === false}
                  onChange={() => setVisibility(false)}
                  disabled={loading}
                />
                <Lock className="visibility-option__icon" aria-hidden="true" />
                <span className="visibility-option__title">Private</span>
                <span className="visibility-option__desc">
                  Only you can see this repository.
                </span>
              </label>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="create-repo__actions">
            <Link to="/">
              <Button variant="secondary" type="button" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={loading} disabled={loading}>
              Create repository
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default CreateRepo;
