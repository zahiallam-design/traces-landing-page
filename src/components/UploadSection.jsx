import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './UploadSection.css';

// Smash API key is now handled server-side via Vercel Serverless Functions
// No API key needed in frontend - more secure!

function UploadSection({ albumIndex, selectedAlbum, onUploadComplete }) {
  const breakpoint = useBreakpoint();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);
  const abortControllerRef = useRef(null);

  const maxFiles = selectedAlbum?.size || 50;

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus({ 
      type: 'error', 
      message: 'Upload cancelled by user.' 
    });
  }, []);

  const uploadToSmash = useCallback(async () => {
    if (selectedFiles.length === 0 || isUploading) return;

    // Create new abort controller for this upload
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus(null);

    try {
      console.log('Starting upload via API...', { fileCount: selectedFiles.length });
      
      // Ensure files have proper extensions and unique names
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/heic': '.heic',
        'image/heif': '.heif'
      };
      
      const usedNames = new Set();
      
      const filesToUpload = selectedFiles.map((file) => {
        if (!(file instanceof File)) {
          throw new Error(`Invalid file object: ${file.name}`);
        }
        
        const extension = mimeToExt[file.type] || '.jpg';
        let fileName = file.name;
        
        // Fix extension if needed
        if (!fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)) {
          fileName = fileName.replace(/\.[^/.]+$/, '') + extension;
        }
        
        // Ensure unique filename
        let finalFileName = fileName;
        let counter = 1;
        while (usedNames.has(finalFileName)) {
          const baseName = fileName.replace(/\.[^/.]+$/, '');
          const ext = fileName.split('.').pop();
          finalFileName = `${baseName}_${counter}.${ext}`;
          counter++;
        }
        usedNames.add(finalFileName);
        
        if (finalFileName !== file.name) {
          return new File([file], finalFileName, { type: file.type, lastModified: file.lastModified });
        }
        
        return file;
      });

      // Upload files in batches to avoid Vercel's 4.5MB request size limit
      // Vercel serverless functions have a ~4.5MB body size limit
      const BATCH_SIZE = 5; // Upload 5 files at a time
      const batches = [];
      
      for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
        batches.push(filesToUpload.slice(i, i + BATCH_SIZE));
      }

      console.log(`Uploading ${filesToUpload.length} files in ${batches.length} batches`);

      // Track progress
      let uploadedCount = 0;
      const totalFiles = filesToUpload.length;
      let progressInterval = null;

      // Upload first batch to create transfer, then add remaining files
      let transferId = null;
      let transferUrl = null;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const formData = new FormData();
        
        batch.forEach((file) => {
          formData.append('files', file);
        });

        // Include transferId if we already have one (for subsequent batches)
        if (transferId) {
          formData.append('transferId', transferId);
        }

        // Update progress before upload - more granular for better feedback
        const progress = Math.floor(((batchIndex + 1) / batches.length) * 95);
        setUploadProgress(Math.min(progress, 95)); // Cap at 95% until all batches complete

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          signal: signal
        });

        if (!response.ok) {
          // Handle errors, especially 413 (Content Too Large)
          let errorMessage = 'Upload failed';
          
          if (response.status === 413) {
            errorMessage = 'Files are too large. Uploading in smaller batches...';
            // The batching should handle this, but if a single batch is too large, show error
            throw new Error('Batch too large. Please upload fewer files at once or compress images.');
          }
          
          // Try to parse JSON error response
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
              errorMessage = `Server error (${response.status})`;
            }
          } else {
            // Non-JSON response (like HTML error page)
            try {
              const errorText = await response.text();
              errorMessage = errorText || `Server error (${response.status})`;
            } catch (e) {
              errorMessage = `Server error (${response.status})`;
            }
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Store transfer info from first batch
        if (batchIndex === 0) {
          transferId = result.transferId;
          transferUrl = result.transferUrl;
        }

        uploadedCount++;
      }

      // Clear any interval if it exists
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      if (!transferUrl) {
        throw new Error('Upload completed but no transfer URL received');
      }

      // Set to 100% when complete and stop
      setUploadProgress(100);
      setIsUploading(false);
      
      setUploadStatus({ 
        type: 'success', 
        message: 'Upload complete! Photos uploaded successfully. You can now proceed with your order.' 
      });
      onUploadComplete(transferUrl, totalFiles);

    } catch (error) {
      console.error('Upload error:', error);
      
      // Don't show error if upload was cancelled
      if (signal.aborted) {
        return;
      }
      
      // Clear interval on error
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      let errorMessage = 'Upload failed. ';
      
      if (error.name === 'AbortError' || signal.aborted) {
        errorMessage = 'Upload cancelled.';
      } else if (error.message?.includes('timeout')) {
        errorMessage += 'Upload took too long. Please try with fewer or smaller files.';
      } else if (error.message?.includes('API key')) {
        errorMessage += 'Server configuration error. Please contact support.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      setUploadStatus({ type: 'error', message: errorMessage });
      setUploadProgress(0);
      setIsUploading(false);
    } finally {
      if (!signal.aborted) {
        setIsUploading(false);
      }
      abortControllerRef.current = null;
    }
  }, [selectedFiles, isUploading, onUploadComplete]);

  // Manual upload - no automatic trigger
  const handleUploadClick = () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one photo to upload.');
      return;
    }
    if (isUploading) {
      return;
    }
    uploadToSmash();
  };

  const handleFileSelect = (files) => {
    // Prevent uploads if no album is selected
    if (!selectedAlbum) {
      alert('Please select an album size first before uploading photos.');
      document.getElementById('album-options')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    // If currently uploading, cancel it first
    if (isUploading) {
      cancelUpload();
    }
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    // If we already have uploaded files and are adding more, reset upload status
    const willResetUpload = uploadStatus?.type === 'success';
    
    if (selectedFiles.length + imageFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} photos. Please remove some files or select a different album size.`);
      return;
    }

    // Handle duplicate file names by adding unique identifiers
    const newFiles = imageFiles.map(file => {
      // Check if file with same name and size already exists
      const existingFile = selectedFiles.find(f => f.name === file.name && f.size === file.size);
      
      if (existingFile) {
        // Create a new File object with a unique name
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const uniqueName = `${baseName}_${timestamp}_${randomSuffix}.${fileExtension}`;
        
        // Create new File object with unique name
        return new File([file], uniqueName, { 
          type: file.type, 
          lastModified: file.lastModified 
        });
      }
      
      return file;
    });

    // Reset upload state if adding files after successful upload
    if (willResetUpload) {
      setUploadStatus(null);
      setUploadProgress(0);
      onUploadComplete(null, 0);
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropzoneRef.current?.classList.remove('dragover');
    if (!isUploading && selectedAlbum) {
      handleFileSelect(e.dataTransfer.files);
    } else if (!selectedAlbum) {
      alert('Please select an album size first before uploading photos.');
      document.getElementById('album-options')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropzoneRef.current?.classList.add('dragover');
  };

  const handleDragLeave = () => {
    dropzoneRef.current?.classList.remove('dragover');
  };

  const removeFile = (index) => {
    // Don't allow removing files after upload is complete
    if (uploadStatus?.type === 'success') {
      return;
    }
    
    if (isUploading) {
      // If uploading, cancel the upload first
      cancelUpload();
    }
    
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    // If all files removed, clear upload status and notify parent
    if (newFiles.length === 0) {
      setUploadStatus(null);
      setUploadProgress(0);
      // Clear the transfer URL in parent component
      onUploadComplete(null, 0);
    }
  };
  
  const clearAllFiles = () => {
    if (isUploading) {
      cancelUpload();
    }
    
    setSelectedFiles([]);
    setUploadStatus(null);
    setUploadProgress(0);
    onUploadComplete(null, 0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <section id={`upload-photos-${albumIndex}`} className="upload-section">
      <div className="container">
        <h2 className="section-title">Album {albumIndex + 1} - Upload Your Photos</h2>
        {!selectedAlbum ? (
          <div className="upload-disabled-message">
            <p>Please select an album size above to enable photo uploads.</p>
            <p className="upload-note">The number of photos you can upload depends on the album size you choose.</p>
          </div>
        ) : (
          <>
            <div className="upload-instructions">
              <p>Select and upload your photos directly (up to {maxFiles} photos):</p>
              <p className="upload-note">You can select multiple photos at once. Supported formats: JPG, PNG, HEIC</p>
            </div>
            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <div
                ref={dropzoneRef}
                className="upload-dropzone"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p className="upload-text">Click to select photos or drag and drop</p>
                <p className="upload-hint">Select up to {maxFiles} photos</p>
              </div>
              {selectedFiles.length > 0 && (
                <div className="file-list">
                  {selectedFiles.map((file, index) => (
                    <FileItem
                      key={`${file.name}-${index}`}
                      file={file}
                      index={index}
                      onRemove={removeFile}
                      formatFileSize={formatFileSize}
                      isUploadComplete={uploadStatus?.type === 'success'}
                    />
                  ))}
                </div>
              )}
              {selectedFiles.length > 0 && !isUploading && uploadStatus?.type !== 'success' && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button 
                    onClick={handleUploadClick}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                  >
                    Upload Photos
                  </button>
                </div>
              )}
              {uploadStatus?.type === 'success' && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button 
                    onClick={clearAllFiles}
                    className="btn btn-secondary"
                    style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                  >
                    Clear All & Start Over
                  </button>
                </div>
              )}
              {isUploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <p className="progress-text">Uploading... {uploadProgress}% ({selectedFiles.length} files)</p>
                    <button 
                      onClick={cancelUpload}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      Cancel Upload
                    </button>
                  </div>
                </div>
              )}
              {uploadStatus && !isUploading && (
                <div className={`upload-status ${uploadStatus.type}`}>
                  {uploadStatus.type === 'success' ? '✓' : '✗'} {uploadStatus.message}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FileItem({ file, index, onRemove, formatFileSize, isUploadComplete }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <div className="file-item">
      <div className="file-info">
        {preview && <img className="file-icon" src={preview} alt="Preview" />}
        <div className="file-details">
          <div className="file-name">{file.name}</div>
          <div className="file-size">{formatFileSize(file.size)}</div>
        </div>
      </div>
      <button 
        className="file-remove" 
        onClick={() => onRemove(index)} 
        aria-label="Remove file"
        disabled={isUploadComplete}
        style={{ 
          opacity: isUploadComplete ? 0.5 : 1,
          cursor: isUploadComplete ? 'not-allowed' : 'pointer',
          pointerEvents: isUploadComplete ? 'none' : 'auto'
        }}
        title={isUploadComplete ? 'Files are locked after upload. Use "Clear All" to start over.' : 'Remove file'}
      >
        ×
      </button>
    </div>
  );
}

export default UploadSection;

