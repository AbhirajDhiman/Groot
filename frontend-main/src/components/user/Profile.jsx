import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Globe, Lock, Clock, BookOpen, Users, LogOut } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../authContext';
import { API_BASE_URL } from '../../config/api';
import PageLayout from '../PageLayout';
import { Avatar, Badge, Button, EmptyState, Skeleton } from '../ui';
import HeatMapProfile from './HeatMap';
import './profile.css';
import '../dashboard/dashboard.css';

/* ------------------------------------------------------------------ */
/* Helpers (same as Dashboard)                                          */
/* ------------------------------------------------------------------ */

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
/* Repo card (same shape as Dashboard)                                  */
/* ------------------------------------------------------------------ */

const ProfileRepoCard = ({ repo }) => {
  const isPublic = repo.visibility === true || repo.visibility === 'public';
  return (
    <article className="repo-card">
      <div className="repo-card__header">
        <span className="repo-card__name">{repo.name}</span>
        <Badge variant={isPublic ? 'public' : 'private'}>
          {isPublic ? (
            <><Globe size={10} aria-hidden="true" /> Public</>
          ) : (
            <><Lock size={10} aria-hidden="true" /> Private</>
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
/* Profile                                                              */
/* ------------------------------------------------------------------ */

const Profile = () => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState({ username: 'Developer', email: '' });
  const [loading, setLoading] = useState(true);
  const { setCurrentUser } = useAuth();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const response = await axios.get(`${API_BASE_URL}/userProfile/${userId}`);
          setUserDetails(response.data);
        } catch (err) {
          console.error('Cannot fetch user details: ', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setCurrentUser(null);
    window.location.href = '/auth';
  };

  const repos = userDetails.repositories || [];
  const following = userDetails.followedUsers || [];

  return (
    <PageLayout>
      {loading ? (
        /* Loading skeleton */
        <div className="profile-layout">
          <div className="profile-sidebar profile-sidebar-skeleton">
            <Skeleton variant="avatar-lg" style={{ width: 120, height: 120 }} />
            <Skeleton variant="heading" width="70%" />
            <Skeleton variant="text" width="55%" />
            <Skeleton variant="text" width="40%" />
          </div>
          <div className="profile-main">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: '20px 24px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <Skeleton variant="heading" width="50%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text-sm" width="30%" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="profile-layout">
          {/* ---- Sidebar ---- */}
          <aside className="profile-sidebar">
            <div className="profile-avatar-wrapper">
              <Avatar name={userDetails.username} size="2xl" />
            </div>

            <div className="profile-info">
              <h1 className="profile-username">{userDetails.username}</h1>
              {userDetails.email && (
                <p className="profile-email">{userDetails.email}</p>
              )}
              <div className="profile-badge-row">
                <Badge variant="accent">Groot User</Badge>
              </div>
            </div>

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat__value">{repos.length}</span>
                <span className="profile-stat__label">Repositories</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat__value">{following.length}</span>
                <span className="profile-stat__label">Following</span>
              </div>
            </div>

            <div className="profile-actions">
              <Link to="/">
                <Button variant="secondary" full>
                  <BookOpen size={15} aria-hidden="true" />
                  View repositories
                </Button>
              </Link>
              <Button variant="danger" full onClick={handleLogout} id="logout">
                <LogOut size={15} aria-hidden="true" />
                Sign out
              </Button>
            </div>
          </aside>

          {/* ---- Main content ---- */}
          <main className="profile-main">
            {/* Activity heatmap */}
            <section aria-label="Recent activity">
              <h2 className="profile-section-title">Activity</h2>
              <div className="profile-heatmap-card">
                <HeatMapProfile />
              </div>
            </section>

            {/* Repositories */}
            <section aria-label="Repositories">
              <h2 className="profile-section-title">
                Repositories ({repos.length})
              </h2>

              {repos.length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={40} />}
                  title="No repositories yet"
                  description="Create your first Groot repository."
                  action={
                    <Link to="/create">
                      <Button variant="primary">Create repository</Button>
                    </Link>
                  }
                />
              ) : (
                <div className="profile-repos">
                  {repos.map((repo, i) => (
                    <ProfileRepoCard key={repo._id || i} repo={repo} />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      )}
    </PageLayout>
  );
};

export default Profile;
