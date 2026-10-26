import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitBranch, Plus, User, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../authContext';
import { Avatar } from './ui';
import './Navbar.css';
// Remove old navbar.css — this file replaces it entirely

const Navbar = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  // Derive display name: currentUser holds the userId string
  const displayName = currentUser || 'User';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      const target = e.target;
      const triggerEl = triggerRef.current;
      const menuEl = menuRef.current;

      if (
        menuEl &&
        !menuEl.contains(target) &&
        (!triggerEl || !triggerEl.contains(target))
      ) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setCurrentUser(null);
    window.location.href = '/auth';
  };

  return (
    <header className="navbar" role="banner">
      <div className="navbar__inner">
        {/* Brand */}
        <Link to="/" className="navbar__brand" aria-label="Groot home">
          <GitBranch className="navbar__logo-icon" aria-hidden="true" />
          <span className="navbar__wordmark">groot</span>
        </Link>

        {/* Right-side actions */}
        <nav className="navbar__actions" aria-label="Primary navigation">
          <Link to="/" className="navbar__nav-link" aria-label="Dashboard">
            <LayoutDashboard size={16} aria-hidden="true" />
            <span className="navbar__nav-link-label">Dashboard</span>
          </Link>

          <Link to="/create" className="navbar__nav-link" aria-label="New repository">
            <Plus size={16} aria-hidden="true" />
            <span className="navbar__nav-link-label">New</span>
          </Link>

          {/* User dropdown */}
          <div className="navbar__dropdown-wrapper">
            <button
              ref={triggerRef}
              className="navbar__user-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label="User menu"
            >
              <Avatar name={displayName} size="sm" />
              <ChevronDown size={14} aria-hidden="true" />
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                className="navbar__dropdown"
                role="menu"
                aria-label="User options"
              >
                <div className="navbar__dropdown-header">
                  <span className="navbar__dropdown-username">{displayName}</span>
                </div>

                <Link
                  to="/profile"
                  className="navbar__dropdown-item"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={14} aria-hidden="true" />
                  Profile
                </Link>

                <div className="navbar__dropdown-divider" role="separator" />

                <button
                  className="navbar__dropdown-item navbar__dropdown-item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut size={14} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
