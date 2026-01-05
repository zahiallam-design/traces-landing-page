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
          <p className={`hero-subtitle ${isMobile ? 'hero-subtitle-mobile' : ''}`}>
            Upload, Print, and Receive — All Done For You
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

