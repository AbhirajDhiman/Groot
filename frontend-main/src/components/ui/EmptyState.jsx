import React from 'react';
import './EmptyState.css';

/**
 * EmptyState
 *
 * Props:
 *  icon        — React element (Lucide icon)
 *  title       — string
 *  description — string
 *  action      — React element (e.g., a Button)
 */
const EmptyState = ({ icon, title, description, action, className = '' }) => {
  return (
    <div className={['empty-state', className].filter(Boolean).join(' ')}>
      {icon && (
        <span className="empty-state__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {title && <h3 className="empty-state__title">{title}</h3>}
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};

export default EmptyState;
