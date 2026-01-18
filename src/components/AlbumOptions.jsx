import React, { useState } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './AlbumOptions.css';

const albums = [
  { size: 52, price: 33 },
  { size: 100, price: 47 }
];

function AlbumOptions({ albumIndex, selectedAlbum, onAlbumSelect, selectedColor, onColorChange, hasError, onRemoveAlbum, canRemoveAlbum, isUploading, isLocked = false }) {
  const breakpoint = useBreakpoint();
  const isMobile = ['xs', 'ss', 'sm'].includes(breakpoint);

  const handleSizeSelect = (album) => {
    if (isLocked) {
      return;
    }
    onAlbumSelect(album);
    // Scroll to color selection after a short delay
    setTimeout(() => {
      const colorSection = document.getElementById(`color-selection-${albumIndex}`);
      if (colorSection) {
        colorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  const handleColorSelect = (color) => {
    if (isLocked) {
      return;
    }
    onColorChange(color);
    // Scroll to upload section after color is selected
    setTimeout(() => {
      const uploadSection = document.getElementById(`upload-photos-${albumIndex}`);
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  return (
    <section id={`album-options-${albumIndex}`} className={`album-options ${hasError ? 'has-error' : ''}`}>
      <div className="container">
        <h2 className="section-title">
          Album {albumIndex + 1} - Choose Your Album
          {hasError && <span className="error-badge" title="This step needs to be completed">⚠</span>}
        </h2>
        
        {onRemoveAlbum && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <button
              onClick={() => onRemoveAlbum(albumIndex)}
              disabled={!canRemoveAlbum || isUploading}
              className="btn-remove-album"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: '#929191',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (!canRemoveAlbum || isUploading) ? 'not-allowed' : 'pointer',
                opacity: (!canRemoveAlbum || isUploading) ? 0.5 : 1,
                fontWeight: '500',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (canRemoveAlbum && !isUploading) {
                  e.target.style.backgroundColor = '#7a7a7a';
                }
              }}
              onMouseLeave={(e) => {
                if (canRemoveAlbum && !isUploading) {
                  e.target.style.backgroundColor = '#929191';
                }
              }}
              title={isUploading ? 'Cannot remove album while uploading' : !canRemoveAlbum ? 'At least one album is required' : 'Remove this album'}
            >
              Cancel Album
            </button>
          </div>
        )}
        
        {/* Step 1: Size Selection */}
        <div className="album-selection-step">
          <h3 className="step-title">Step 1: Choose Size</h3>
          <div className="size-buttons">
            {albums.map((album) => (
              <button
                key={album.size}
                className={`size-btn ${selectedAlbum?.size === album.size ? 'selected' : ''}`}
                onClick={() => handleSizeSelect(album)}
                disabled={isLocked}
                title={isLocked ? 'Album size is locked' : 'Select album size'}
                style={{
                  opacity: isLocked ? 0.6 : 1,
                  cursor: isLocked ? 'not-allowed' : 'pointer'
                }}
              >
                <span className="size-number">{album.size}</span>
                <span className="size-label">Photos</span>
                <span className="size-price">${album.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Color Selection (only show if size is selected) */}
        {selectedAlbum && (
          <div id={`color-selection-${albumIndex}`} className={`album-selection-step ${hasError && !selectedColor ? 'has-error' : ''}`}>
            <h3 className="step-title">
              Step 2: Choose Color
              {hasError && !selectedColor && <span className="error-badge" title="This step needs to be completed">⚠</span>}
            </h3>
            <div className="color-album-selection">
              <button
                className={`color-album-btn ${selectedColor === 'green' ? 'selected' : ''}`}
                onClick={() => handleColorSelect('green')}
                disabled={isLocked}
                title={isLocked ? 'Album color is locked' : 'Select album color'}
                style={{
                  opacity: isLocked ? 0.6 : 1,
                  cursor: isLocked ? 'not-allowed' : 'pointer'
                }}
              >
                <img 
                  src="/Green Album.jpeg" 
                  alt="Green Album"
                  className="color-album-image"
                />
                <span className="color-album-label">Green</span>
              </button>
              <button
                className={`color-album-btn ${selectedColor === 'grey' ? 'selected' : ''}`}
                onClick={() => handleColorSelect('grey')}
                disabled={isLocked}
                title={isLocked ? 'Album color is locked' : 'Select album color'}
                style={{
                  opacity: isLocked ? 0.6 : 1,
                  cursor: isLocked ? 'not-allowed' : 'pointer'
                }}
              >
                <img 
                  src="/Grey Album.jpeg" 
                  alt="Grey Album"
                  className="color-album-image"
                />
                <span className="color-album-label">Grey</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default AlbumOptions;

