import React from 'react';
import './Button.css';

/**
 * Button primitive
 *
 * Props:
 *  variant  — 'primary' | 'secondary' | 'ghost' | 'danger'   (default: 'primary')
 *  size     — 'sm' | 'md' | 'lg'                              (default: 'md')
 *  full     — boolean, full-width                             (default: false)
 *  loading  — boolean, shows spinner + disables               (default: false)
 *  iconOnly — boolean, square pad for icon-only buttons       (default: false)
 *  All other native <button> props are forwarded.
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  full = false,
  loading = false,
  iconOnly = false,
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' ? `btn--${size}` : '',
    full ? 'btn--full' : '',
    iconOnly ? 'btn--icon' : '',
    loading ? 'btn--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
};

export default Button;
