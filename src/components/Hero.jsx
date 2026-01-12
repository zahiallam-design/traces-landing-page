import React from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './Hero.css';

function Hero() {
  const breakpoint = useBreakpoint();
  const isMobile = ['xs', 'ss', 'sm'].includes(breakpoint);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1 className={`hero-title ${isMobile ? 'hero-title-mobile' : ''}`}>
            Turn Your Favorite Photos Into Beautiful Albums
          </h1>
          <div className={`hero-subtitle ${isMobile ? 'hero-subtitle-mobile' : ''}`}>
            <p style={{ marginBottom: '0.5rem' }}>You select, upload and submit</p>
            <p>We print, fill and send you the album</p>
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--pastel-green-dark)', fontWeight: '500', fontSize: '1rem' }}>
            🎉 Free delivery on orders above $90!
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => scrollToSection('album-count-selector')}
          >
            Start Your Order
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;

