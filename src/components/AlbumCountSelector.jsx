import React, { useState } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './AlbumCountSelector.css';

function AlbumCountSelector({ onCountSelect, currentCount }) {
  const breakpoint = useBreakpoint();
  const [selectedCount, setSelectedCount] = useState(currentCount || null);

  const handleSelect = (count) => {
    setSelectedCount(count);
    onCountSelect(count);
    // Scroll to album sections after a brief delay
    setTimeout(() => {
      const element = document.getElementById('album-sections');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <section id="album-count-selector" className="album-count-selector">
      <div className="container">
        <h2 className="section-title">How Many Albums Would You Like?</h2>
        <p className="section-subtitle">Select the number of albums you want to order (maximum 5). You can change this anytime.</p>
        <div className={`album-count-grid ${['xs', 'ss', 'sm'].includes(breakpoint) ? 'album-count-grid-mobile' : ''}`}>
          {[1, 2, 3, 4, 5].map((count) => (
            <button
              key={count}
              className={`album-count-btn ${selectedCount === count ? 'selected' : ''}`}
              onClick={() => handleSelect(count)}
            >
              <span className="count-number">{count}</span>
              <span className="count-label">{count === 1 ? 'Album' : 'Albums'}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AlbumCountSelector;

