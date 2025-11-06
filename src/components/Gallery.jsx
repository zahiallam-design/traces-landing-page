import React from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './Gallery.css';

const galleryItems = [
  { size: 50, color: 'green' },
  { size: 50, color: 'grey' },
  { size: 100, color: 'green' },
  { size: 100, color: 'grey' }
];

function Gallery() {
  const breakpoint = useBreakpoint();
  const isMobile = ['xs', 'ss', 'sm'].includes(breakpoint);

  return (
    <section id="gallery" className="gallery-section">
      <div className="container">
        <h2 className="section-title">See Our Albums</h2>
        <div className={`gallery-grid ${isMobile ? 'gallery-grid-mobile' : ''}`}>
          {galleryItems.map((item, index) => (
            <div key={index} className="gallery-item">
              <div className={`gallery-placeholder ${item.color}`}></div>
              <p>{item.size} Photos - {item.color.charAt(0).toUpperCase() + item.color.slice(1)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Gallery;

