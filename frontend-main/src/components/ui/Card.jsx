import React from 'react';
import './Card.css';

/**
 * Card primitive
 *
 * Props:
 *  flush       — boolean, removes padding
 *  interactive — boolean, hover effect + cursor pointer
 *  selected    — boolean, accent border + muted fill
 *  as          — element type (default: 'div')
 */
const Card = ({
  flush = false,
  interactive = false,
  selected = false,
  as: Tag = 'div',
  className = '',
  children,
  ...props
}) => {
  const classes = [
    'card',
    flush ? 'card--flush' : '',
    interactive ? 'card--interactive' : '',
    selected ? 'card--selected' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
};

export default Card;
