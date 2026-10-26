import React from 'react';
import './Skeleton.css';

/**
 * Skeleton — shimmer loading placeholder
 *
 * Props:
 *  variant — 'text' | 'text-sm' | 'heading' | 'avatar-sm' | 'avatar-lg' |
 *            'badge' | 'card'  (default: 'text')
 *  width   — CSS width string (default: '100%')
 *  className — extra classes
 */
export const Skeleton = ({ variant = 'text', width, className = '', style = {} }) => {
  const classes = ['skeleton', `skeleton--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={width ? { width, ...style } : style}
      aria-hidden="true"
    />
  );
};

/**
 * RepoCardSkeleton — one full repo card shimmer
 */
export const RepoCardSkeleton = () => (
  <div className="skeleton-repo-card" aria-hidden="true">
    <div className="skeleton-repo-card__row">
      <Skeleton variant="heading" width="55%" />
      <Skeleton variant="badge" />
    </div>
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text-sm" width="35%" />
  </div>
);

export default Skeleton;
