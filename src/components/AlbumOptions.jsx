import React, { useState } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './AlbumOptions.css';

const albums = [
  { size: 50, price: 40 },
  { size: 100, price: 55 }
];

function AlbumCard({ album, isSelected, onSelect, selectedColor, onColorChange, albumIndex }) {
  const handleColorClick = (color) => {
    // If album is not selected yet, select it with this color
    if (!isSelected) {
      onSelect(album);
      // Small delay to ensure album is selected before changing color
      setTimeout(() => {
        onColorChange(color);
      }, 10);
    } else {
      // Album is already selected, just change color
      onColorChange(color);
    }
  };
  
  // Use selectedColor only if this album is selected, otherwise use default green for display
  const displayColor = isSelected ? selectedColor : 'green';

  return (
    <div className={`album-card ${isSelected ? 'selected' : ''}`}>
      <div className="album-image">
        <img 
          src={displayColor === 'green' ? '/Green Album.jpg' : '/Grey Album.jpg'} 
          alt={`${displayColor} album`}
          className="album-image-preview"
        />
      </div>
      <h3 className="album-title">Up to {album.size} Photos</h3>
      <p className="album-price">${album.price}</p>
      <p className="album-details">A6 size prints</p>
      <div className="color-selection">
        <button 
          className={`color-btn ${isSelected && selectedColor === 'green' ? 'active' : ''}`}
          onClick={() => handleColorClick('green')}
          aria-label="Green color"
        >
          <span className="color-swatch green"></span>
        </button>
        <button 
          className={`color-btn ${isSelected && selectedColor === 'grey' ? 'active' : ''}`}
          onClick={() => handleColorClick('grey')}
          aria-label="Grey color"
        >
          <span className="color-swatch grey"></span>
        </button>
      </div>
    </div>
  );
}

function AlbumOptions({ albumIndex, selectedAlbum, onAlbumSelect, selectedColor, onColorChange }) {
  const breakpoint = useBreakpoint();
  const isMobile = ['xs', 'ss', 'sm'].includes(breakpoint);

  const handleSelect = (album) => {
    onAlbumSelect(album);
    // Scroll to upload section for this album
    setTimeout(() => {
      const element = document.getElementById(`upload-photos-${albumIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <section id={`album-options-${albumIndex}`} className="album-options">
      <div className="container">
        <h2 className="section-title">Album {albumIndex + 1} - Choose Your Album</h2>
        <div className={`album-cards ${isMobile ? 'album-cards-mobile' : ''}`}>
          {albums.map((album) => (
            <AlbumCard
              key={album.size}
              album={album}
              albumIndex={albumIndex}
              isSelected={selectedAlbum?.size === album.size}
              onSelect={handleSelect}
              selectedColor={selectedColor}
              onColorChange={onColorChange}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default AlbumOptions;

