import React, { useState, useRef } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './CoverCustomization.css';

function CoverCustomization({ albumIndex, onCoverChange }) {
  const breakpoint = useBreakpoint();
  const [coverType, setCoverType] = useState(null); // 'image' or 'text'
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [coverTitle, setCoverTitle] = useState('');
  const [coverDate, setCoverDate] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const fileInputRef = useRef(null);

  const handleCoverTypeSelect = (type) => {
    setCoverType(type);
    // If image type is selected, automatically trigger file input
    if (type === 'image') {
      // Small delay to ensure state is updated
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
      onCoverChange({
        type: 'image',
        image: coverImage
      });
    } else {
      // Notify parent immediately for text type
      onCoverChange({
        type: 'text',
        title: coverTitle,
        date: coverDate
      });
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCoverImage(file);
      setIsUploadingCover(true);
      
      try {
        // Upload cover image to Smash
        const formData = new FormData();
        formData.append('files', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload cover image');
        }
        
        const result = await response.json();
        
        if (!result.success || !result.transferUrl) {
          throw new Error('No transfer URL received for cover image');
        }
        
        setCoverImageUrl(result.transferUrl);
        onCoverChange({
          type: 'image',
          image: file,
          imageUrl: result.transferUrl
        });
      } catch (error) {
        console.error('Cover image upload error:', error);
        alert('Failed to upload cover image. Please try again.');
        setCoverImage(null);
      } finally {
        setIsUploadingCover(false);
      }
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
    <section className="cover-customization">
      <div className="container">
        <h2 className="section-title">Album {albumIndex + 1} - Cover Customization</h2>
        <div className="cover-customization-content">
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
                disabled={isUploadingCover}
              >
                {isUploadingCover ? 'Uploading...' : coverImage ? 'Change Cover Image' : 'Upload Cover Image'}
              </button>
              {coverImage && (
                <div className="cover-image-preview">
                  <img src={URL.createObjectURL(coverImage)} alt="Cover preview" />
                  <p className="preview-label">{coverImage.name}</p>
                  {coverImageUrl && (
                    <p className="preview-url" style={{ fontSize: '0.8rem', color: 'var(--pastel-green-dark)', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                      Cover uploaded: {coverImageUrl}
                    </p>
                  )}
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
      </div>
    </section>
  );
}

export default CoverCustomization;

