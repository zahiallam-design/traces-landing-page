import React, { useState } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './AlbumOptions.css';

const albums = [
  { size: 50, price: 40 },
  { size: 100, price: 55 }
];

function AlbumCard({ album, isSelected, onSelect, selectedColor, onColorChange }) {
  const [localColor, setLocalColor] = useState('green');
  const currentColor = isSelected ? selectedColor : localColor;

  const handleColorClick = (color) => {
    if (isSelected) {
      onColorChange(color);
    } else {
      setLocalColor(color);
    }
  };

  return (
    <div className={`album-card ${isSelected ? 'selected' : ''}`}>
      <div className="album-image">
        <div className={`album-placeholder ${currentColor}`}></div>
      </div>
      <h3 className="album-title">Up to {album.size} Photos</h3>
      <p className="album-price">${album.price}</p>
      <p className="album-details">A6 size prints</p>
      <div className="color-selection">
        <button 
          className={`color-btn ${currentColor === 'green' ? 'active' : ''}`}
          onClick={() => handleColorClick('green')}
          aria-label="Green color"
        >
          <span className="color-swatch green"></span>
        </button>
        <button 
          className={`color-btn ${currentColor === 'grey' ? 'active' : ''}`}
          onClick={() => handleColorClick('grey')}
          aria-label="Grey color"
        >
          <span className="color-swatch grey"></span>
        </button>
      </div>
      <button 
        className="btn btn-select"
        onClick={() => onSelect(album)}
      >
        Select This Album
      </button>
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

