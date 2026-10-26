import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, GitBranch, Lock, Globe, Plus, AlertCircle, Clock } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import PageLayout from '../PageLayout';
import { Button, Badge, EmptyState, RepoCardSkeleton } from '../ui';
import './dashboard.css';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Format an ISO date as "Updated X ago" */
function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/* ------------------------------------------------------------------ */
/* RepoCard                                                              */
/* ------------------------------------------------------------------ */

const RepoCard = ({ repo }) => {
  const isPublic = repo.visibility === true || repo.visibility === 'public';

  return (
    <article className="repo-card">
      <div className="repo-card__header">
        <span className="repo-card__name">{repo.name}</span>
        <Badge variant={isPublic ? 'public' : 'private'}>
          {isPublic ? (
            <>
              <Globe size={10} aria-hidden="true" />
              Public
            </>
          ) : (
            <>
              <Lock size={10} aria-hidden="true" />
              Private
            </>
          )}
        </Badge>
      </div>

      {repo.description && (
        <p className="repo-card__description">{repo.description}</p>
      )}

      <div className="repo-card__meta">
        {repo.updatedAt && (
          <span className="repo-card__meta-item">
            <Clock size={12} aria-hidden="true" />
            {timeAgo(repo.updatedAt)}
          </span>
        )}
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */

const Dashboard = () => {
  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Legacy state kept to not break any downstream data flow
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    const fetchRepositories = async () => {
      if (!userId) return;
      try {
        const response = await fetch(`${API_BASE_URL}/repo/user/${userId}`);
        const data = await response.json();
        const userRepos = Array.isArray(data.repositories) ? data.repositories : [];
        setRepositories(userRepos);
      } catch (err) {
        console.error('Error while fetching user repositories: ', err);
        setError('Could not load repositories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const fetchSuggestedRepositories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/repo/all`);
        const data = await response.json();
        const allRepos = Array.isArray(data) ? data : (data.repositories || []);
        setSuggestedRepositories(allRepos);
      } catch (err) {
        console.error('Error while fetching all repositories: ', err);
      }
    };

    fetchRepositories();
    fetchSuggestedRepositories();
  }, []);

  // Filter + sort
  useEffect(() => {
    let filtered = [...repositories];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((repo) =>
        repo.name.toLowerCase().includes(q) ||
        (repo.description || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'updated') {
      filtered.sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
    }

    setSearchResults(filtered);
  }, [searchQuery, repositories, sortBy]);

  return (
    <PageLayout>
      {/* Header */}
      <div className="dashboard__header">
        <h1 className="dashboard__title">Repositories</h1>
        <Link to="/create">
          <Button variant="primary" size="sm">
            <Plus size={15} aria-hidden="true" />
            New repository
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="dashboard__toolbar">
        <div className="dashboard__search-wrapper">
          <Search
            size={15}
            className="dashboard__search-icon"
            aria-hidden="true"
          />
          <input
            className="dashboard__search"
            type="search"
            placeholder="Find a repository…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search repositories"
          />
        </div>

        <select
          className="dashboard__sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort repositories"
        >
          <option value="updated">Last updated</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="dashboard__error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="skeleton-list" aria-label="Loading repositories" aria-busy="true">
          {[...Array(4)].map((_, i) => (
            <RepoCardSkeleton key={i} />
          ))}
        </div>
      ) : searchResults.length === 0 ? (
        <EmptyState
          icon={<GitBranch size={48} />}
          title={
            searchQuery
              ? `No results for "${searchQuery}"`
              : 'No repositories yet'
          }
          description={
            searchQuery
              ? 'Try a different search term.'
              : 'Create your first Groot repository to start tracking changes.'
          }
          action={
            !searchQuery && (
              <Link to="/create">
                <Button variant="primary">
                  <Plus size={15} aria-hidden="true" />
                  Create repository
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="repo-grid">
          {searchResults.map((repo) => (
            <RepoCard key={repo._id} repo={repo} />
          ))}
        </div>
      )}
    </PageLayout>
  );
};

export default Dashboard;
