import React from 'react';
import './Header.css';

function Header() {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <img 
              src="/logo.png" 
              alt="Traces Logo" 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <span className="logo-text" style={{ display: 'none' }}>Traces</span>
          </div>
          <nav className="nav">
            <button 
              className="nav-link" 
              onClick={() => scrollToSection('how-it-works')}
            >
              How It Works
            </button>
            <button 
              className="nav-link" 
              onClick={() => {
                // Scroll to footer/contact section at the end
                setTimeout(() => {
                  const footer = document.querySelector('footer');
                  if (footer) {
                    footer.scrollIntoView({ behavior: 'smooth', block: 'end' });
                  }
                }, 100);
              }}
            >
              Contact
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;

