import React from 'react';
import './Badge.css';

/**
 * Badge primitive
 *
 * Props:
 *  variant — 'default' | 'public' | 'private' | 'accent' | 'danger'
 */
const Badge = ({ variant = 'default', className = '', children, ...props }) => {
  return (
    <span
      className={['badge', `badge--${variant}`, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
