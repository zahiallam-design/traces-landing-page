import React, { useState } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './AlbumCountSelector.css';

function AlbumCountSelector({ onCountSelect, currentCount, allowDecrease = true }) {
  const breakpoint = useBreakpoint();
  const [selectedCount, setSelectedCount] = useState(currentCount || null);

  const handleSelect = (count) => {
    // If decrease is not allowed and trying to select a lower count, don't do anything
    if (!allowDecrease && currentCount && count < currentCount) {
      return;
    }
    
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
        <p className="section-subtitle">
          {allowDecrease 
            ? 'Select the number of albums you want to order (maximum 5). You can change this anytime.'
            : 'Select the number of albums you want to order (maximum 5). You can add more albums, but cannot reduce the count once selected. Use "Cancel Album" on individual albums to remove them.'
          }
        </p>
        <div className={`album-count-grid ${['xs', 'ss', 'sm'].includes(breakpoint) ? 'album-count-grid-mobile' : ''}`}>
          {[1, 2, 3, 4, 5].map((count) => {
            const isDisabled = !allowDecrease && currentCount && count < currentCount;
            return (
              <button
                key={count}
                className={`album-count-btn ${selectedCount === count ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => handleSelect(count)}
                disabled={isDisabled}
                style={{
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer'
                }}
                title={isDisabled ? 'Cannot reduce album count. Use "Cancel Album" on individual albums to remove them.' : ''}
              >
                <span className="count-number">{count}</span>
                <span className="count-label">{count === 1 ? 'Album' : 'Albums'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AlbumCountSelector;

