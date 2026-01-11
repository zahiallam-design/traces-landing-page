import React, { useState, useRef, useCallback } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop';
import './CoverCustomization.css';

function CoverCustomization({ albumIndex, onCoverChange, hasError }) {
  const breakpoint = useBreakpoint();
  const [coverType, setCoverType] = useState(null); // 'image' or 'text'
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [coverTitle, setCoverTitle] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isCompressingCover, setIsCompressingCover] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
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
        title: coverTitle
      });
    }
  };

  // Compress cover image if needed (same logic as main upload)
  const compressCoverImageIfNeeded = async (file) => {
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
    
    if (file.size <= MAX_FILE_SIZE) {
      return file;
    }
    
    console.log(`Compressing cover image ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
    
    const TARGET_SIZE_MB = 3.8;
    const isVeryLarge = file.size > 20 * 1024 * 1024;
    let currentFile = file;
    let quality = 0.9;
    let maxSizeMB = TARGET_SIZE_MB;
    const maxAttempts = 5;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const isAvif = currentFile.type === 'image/avif' || currentFile.name.toLowerCase().endsWith('.avif');
        let outputType = currentFile.type;
        if (isAvif || currentFile.type === 'image/avif') {
          outputType = 'image/jpeg';
        }
        
        const options = {
          maxSizeMB: maxSizeMB,
          maxWidthOrHeight: 4000,
          useWebWorker: !isVeryLarge,
          fileType: outputType,
          initialQuality: quality,
          alwaysKeepResolution: true,
        };
        
        const compressionTimeout = isVeryLarge ? 60000 : 30000;
        const compressionPromise = imageCompression(currentFile, options);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Compression timeout')), compressionTimeout);
        });
        
        const compressedFile = await Promise.race([compressionPromise, timeoutPromise]);
        
        if (compressedFile.size <= MAX_FILE_SIZE) {
          console.log(`✓ Successfully compressed cover image to ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
          return compressedFile;
        }
        
        currentFile = compressedFile;
        if (attempt < maxAttempts) {
          quality = Math.max(0.5, quality - (attempt === 1 ? 0.05 : 0.1));
          maxSizeMB = Math.max(3.0, maxSizeMB - 0.1);
        } else {
          const finalOptions = {
            maxSizeMB: 3.5,
            maxWidthOrHeight: 4000,
            useWebWorker: !isVeryLarge,
            fileType: (isAvif || currentFile.type === 'image/avif') ? 'image/jpeg' : currentFile.type,
            initialQuality: 0.6,
            alwaysKeepResolution: false,
          };
          const finalCompressed = await imageCompression(currentFile, finalOptions);
          if (finalCompressed.size <= MAX_FILE_SIZE) {
            return finalCompressed;
          }
          throw new Error(`Unable to compress cover image below 4MB. Final size: ${(finalCompressed.size / 1024 / 1024).toFixed(2)} MB`);
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(`Failed to compress cover image: ${error.message}`);
        }
        quality = Math.max(0.3, quality - 0.2);
        maxSizeMB = Math.max(2.0, maxSizeMB - 0.4);
      }
    }
    
    throw new Error(`Unable to compress cover image below 4MB`);
  };

  // Check if image is square
  const isImageSquare = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(Math.abs(img.width - img.height) < 5); // Allow 5px tolerance
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      img.src = url;
    });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type (same as main upload)
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'image/heic', 'image/heif', 'image/avif'
    ];
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif'];
    const unsupportedFormats = ['gif', 'bmp', 'tiff', 'tif', 'svg', 'dng'];
    
    // Check for DNG
    const isDng = file.name.toLowerCase().endsWith('.dng') || 
                  file.type === 'image/x-adobe-dng' || 
                  file.type === 'image/dng';
    
    if (isDng) {
      alert(`DNG (RAW) files are not supported!\n\nBrowsers cannot convert RAW image files. Please convert your DNG file to JPEG first.\n\nSupported formats: JPEG, PNG, WebP, HEIC, HEIF, AVIF`);
      return;
    }
    
    // Check for other unsupported formats
    const hasSupportedType = supportedTypes.includes(file.type.toLowerCase());
    const hasSupportedExtension = supportedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    const hasUnsupportedExtension = unsupportedFormats.some(ext =>
      file.name.toLowerCase().endsWith(`.${ext}`)
    );
    const isUnsupportedType = file.type && (
      file.type.toLowerCase().includes('gif') ||
      file.type.toLowerCase().includes('bmp') ||
      file.type.toLowerCase().includes('tiff') ||
      file.type.toLowerCase().includes('svg')
    );
    
    if ((!hasSupportedType && !hasSupportedExtension) || hasUnsupportedExtension || isUnsupportedType) {
      const formatName = file.type || 'Unknown format';
      alert(`Unsupported image format detected!\n\nFile: ${file.name}\nFormat: ${formatName}\n\nSupported formats: JPEG, PNG, WebP, HEIC, HEIF, AVIF\n\nPlease convert this file to a supported format and try again.`);
      return;
    }
    
    setUploadError(null);
    
    // Check if image is square - if not, show crop modal
    const isSquare = await isImageSquare(file);
    if (!isSquare) {
      setImageToCrop(file);
      setShowCropModal(true);
      return;
    }
    
    // If square, proceed with upload
    await uploadCoverImage(file);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    canvas.width = maxSize;
    canvas.height = maxSize;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      maxSize,
      maxSize
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], 'cropped-cover.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropComplete = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const imageUrl = URL.createObjectURL(imageToCrop);
      const croppedFile = await getCroppedImg(imageUrl, croppedAreaPixels);
      URL.revokeObjectURL(imageUrl);
      
      setShowCropModal(false);
      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      
      await uploadCoverImage(croppedFile);
    } catch (error) {
      console.error('Crop error:', error);
      setUploadError('Failed to crop image. Please try again.');
      setShowCropModal(false);
    }
  };

  const uploadCoverImage = async (file) => {
    setIsCompressingCover(true);
    
    try {
      // Compress if needed
      let fileToUpload = file;
      if (file.size > 4 * 1024 * 1024) {
        fileToUpload = await compressCoverImageIfNeeded(file);
      }
      
      setIsCompressingCover(false);
      setIsUploadingCover(true);
      setCoverImage(fileToUpload);
      
      // Upload cover image to Smash
      const formData = new FormData();
      formData.append('files', fileToUpload);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload cover image');
      }
      
      const result = await response.json();
      
      if (!result.success || !result.transferUrl) {
        throw new Error('No transfer URL received for cover image');
      }
      
      setCoverImageUrl(result.transferUrl);
      setUploadError(null); // Clear any previous errors
      onCoverChange({
        type: 'image',
        image: fileToUpload,
        imageUrl: result.transferUrl
      });
    } catch (error) {
      console.error('Cover image upload error:', error);
      setUploadError(error.message || 'Failed to upload cover image. Please try again.');
      setCoverImage(null);
      setCoverImageUrl(null);
    } finally {
      setIsUploadingCover(false);
      setIsCompressingCover(false);
    }
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setCoverTitle(title);
    if (coverType === 'text') {
      onCoverChange({
        type: 'text',
        title: title
      });
    }
  };

  return (
    <section id={`cover-customization-${albumIndex}`} className={`cover-customization ${hasError ? 'has-error' : ''}`}>
      <div className="container">
        <h2 className="section-title">
          Album {albumIndex + 1} - Cover Customization
          {hasError && <span className="error-badge" title="This step needs to be completed">⚠</span>}
        </h2>
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
              {!coverImage && (
                <p className="cover-size-note">
                  <strong>Note:</strong> Your cover image must be square and will be printed in 9×9 cm (3.5" × 3.5") size. If your image is not square, you'll be able to crop it.
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/avif,.avif"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
              <button
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingCover || isCompressingCover}
              >
                {isCompressingCover ? 'Compressing...' : isUploadingCover ? 'Uploading...' : coverImage ? 'Change Cover Image' : 'Select Cover Image'}
              </button>
              {uploadError && (
                <div className="cover-upload-error">
                  <p style={{ color: '#e74c3c', fontSize: '0.9rem', marginTop: '0.5rem' }}>{uploadError}</p>
                </div>
              )}
              {coverImage && !isUploadingCover && !uploadError && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ color: 'var(--pastel-green-dark)', fontSize: '0.9rem', fontWeight: '500' }}>✓ Cover image uploaded successfully! You can now proceed.</p>
                </div>
              )}
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
            </div>
          )}
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && imageToCrop && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-content">
            <h3>Crop Your Cover Image</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
              Your cover image must be square (9×9 cm). Please select the square area you want to use.
            </p>
            <div className="crop-container">
              <Cropper
                image={URL.createObjectURL(imageToCrop)}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '400px',
                    position: 'relative',
                    background: '#000'
                  }
                }}
              />
            </div>
            <div className="crop-controls">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Zoom:
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{ flex: 1, maxWidth: '200px' }}
                />
              </label>
            </div>
            <div className="crop-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCropModal(false);
                  setImageToCrop(null);
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                  setCroppedAreaPixels(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCropComplete}
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CoverCustomization;

