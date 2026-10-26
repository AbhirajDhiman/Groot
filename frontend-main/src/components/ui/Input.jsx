import React, { forwardRef } from 'react';
import './Input.css';

/**
 * Input primitive
 *
 * Props:
 *  label     — string, renders a <label>
 *  hint      — string, renders help text below input
 *  error     — string, renders error text + applies error border
 *  required  — boolean, adds * to label
 *  mono      — boolean, monospace font (for repo names/paths)
 *  All native <input> props are forwarded.
 */
export const Input = forwardRef(function Input(
  { label, hint, error, required, mono, className = '', id, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const inputClasses = [
    'input',
    error ? 'input--error' : '',
    mono ? 'input--mono' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="field">
      {label && (
        <label
          htmlFor={inputId}
          className={`field__label${required ? ' field__label--required' : ''}`}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={inputClasses}
        aria-invalid={!!error}
        aria-describedby={
          [hint && `${inputId}-hint`, error && `${inputId}-error`]
            .filter(Boolean)
            .join(' ') || undefined
        }
        {...props}
      />
      {hint && !error && (
        <span id={`${inputId}-hint`} className="field__hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${inputId}-error`} className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

/**
 * Textarea primitive — same API as Input
 */
export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, className = '', id, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const classes = [
    'textarea',
    error ? 'textarea--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="field">
      {label && (
        <label
          htmlFor={inputId}
          className={`field__label${required ? ' field__label--required' : ''}`}
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={classes}
        aria-invalid={!!error}
        aria-describedby={
          [hint && `${inputId}-hint`, error && `${inputId}-error`]
            .filter(Boolean)
            .join(' ') || undefined
        }
        {...props}
      />
      {hint && !error && (
        <span id={`${inputId}-hint`} className="field__hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${inputId}-error`} className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

export default Input;
