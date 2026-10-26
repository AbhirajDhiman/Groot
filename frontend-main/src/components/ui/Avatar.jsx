import React from 'react';
import './Avatar.css';

/**
 * Avatar
 *
 * Props:
 *  src   — image URL (optional — shows initials fallback)
 *  name  — used for alt text and initials
 *  size  — 'sm' | 'md' | 'lg' | 'xl' | '2xl'  (default: 'md')
 */
const Avatar = ({ src, name = '', size = 'md', className = '', ...props }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const classes = ['avatar', `avatar--${size}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes} title={name} aria-label={name} {...props}>
      {src ? (
        <img src={src} alt={name || 'Avatar'} />
      ) : (
        <span aria-hidden="true">{initials || '?'}</span>
      )}
    </span>
  );
};

export default Avatar;
