import React, { useState, useRef } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './CoverCustomization.css';

function CoverCustomization({ albumIndex, onCoverChange }) {
  const breakpoint = useBreakpoint();
  const [coverType, setCoverType] = useState(null); // 'image' or 'text'
  const [coverImage, setCoverImage] = useState(null);
  const [coverTitle, setCoverTitle] = useState('');
  const [coverDate, setCoverDate] = useState('');
  const fileInputRef = useRef(null);

  const handleCoverTypeSelect = (type) => {
    setCoverType(type);
    // Notify parent immediately
    if (type === 'text') {
      onCoverChange({
        type: 'text',
        title: coverTitle,
        date: coverDate
      });
    } else {
      onCoverChange({
        type: 'image',
        image: coverImage
      });
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCoverImage(file);
      onCoverChange({
        type: 'image',
        image: file
      });
    }
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setCoverTitle(title);
    if (coverType === 'text') {
      onCoverChange({
        type: 'text',
        title: title,
        date: coverDate
      });
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setCoverDate(date);
    if (coverType === 'text') {
      onCoverChange({
        type: 'text',
        title: coverTitle,
        date: date
      });
    }
  };

  return (
    <div className="cover-customization">
      <h3 className="cover-title">Album {albumIndex + 1} - Cover Customization</h3>
      <p className="cover-subtitle">Choose how you want your album cover to look</p>
      
      <div className="cover-type-selection">
        <button
          className={`cover-type-btn ${coverType === 'image' ? 'selected' : ''}`}
          onClick={() => handleCoverTypeSelect('image')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>Image Cover</span>
        </button>
        <button
          className={`cover-type-btn ${coverType === 'text' ? 'selected' : ''}`}
          onClick={() => handleCoverTypeSelect('text')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 7 4 4 20 4 20 7"></polyline>
            <line x1="9" y1="20" x2="15" y2="20"></line>
            <line x1="12" y1="4" x2="12" y2="20"></line>
          </svg>
          <span>Text Cover</span>
        </button>
      </div>

      {coverType === 'image' && (
        <div className="cover-image-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            {coverImage ? 'Change Cover Image' : 'Upload Cover Image'}
          </button>
          {coverImage && (
            <div className="cover-image-preview">
              <img src={URL.createObjectURL(coverImage)} alt="Cover preview" />
              <p className="preview-label">{coverImage.name}</p>
            </div>
          )}
        </div>
      )}

      {coverType === 'text' && (
        <div className="cover-text-section">
          <div className="form-group">
            <label htmlFor={`cover-title-${albumIndex}`}>Cover Title / Sentence *</label>
            <input
              type="text"
              id={`cover-title-${albumIndex}`}
              value={coverTitle}
              onChange={handleTitleChange}
              placeholder="e.g., Our Wedding Day, Family Memories 2024"
              required={coverType === 'text'}
            />
            <small>Enter a title or sentence for your album cover</small>
          </div>
          <div className="form-group">
            <label htmlFor={`cover-date-${albumIndex}`}>Date (Optional)</label>
            <input
              type="text"
              id={`cover-date-${albumIndex}`}
              value={coverDate}
              onChange={handleDateChange}
              placeholder="e.g., June 2024, 2024, Summer 2024"
            />
            <small>Add a date if you'd like</small>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoverCustomization;

