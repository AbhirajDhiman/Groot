import React from 'react';
import Navbar from './Navbar';
import './PageLayout.css';

/**
 * PageLayout — wraps every authenticated page.
 *
 * Props:
 *  narrow   — boolean, constrains content width to 600px
 *  centered — boolean, vertically centers content (auth pages)
 *  noNav    — boolean, hide navbar (auth pages use this)
 */
const PageLayout = ({ narrow = false, centered = false, noNav = false, children }) => {
  const contentClasses = [
    'page-layout__content',
    narrow ? 'page-layout__content--narrow' : '',
    centered ? 'page-layout__content--centered' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="page-layout">
      {!noNav && <Navbar />}
      <main className={contentClasses} id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
