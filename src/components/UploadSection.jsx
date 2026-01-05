import React, { useState, useRef, useEffect, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
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
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);
  const abortControllerRef = useRef(null);

  const maxFiles = selectedAlbum?.size || 50;

  // Compress images that are larger than 4MB
  const compressImageIfNeeded = async (file) => {
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
    
    // If file is already under 4MB, return as-is
    if (file.size <= MAX_FILE_SIZE) {
      return file;
    }
    
    console.log(`Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
    
    try {
      const options = {
        maxSizeMB: 3.5, // Target 3.5MB to be safe
        maxWidthOrHeight: 4000, // Max dimension
        useWebWorker: true, // Use web worker for better performance
        fileType: file.type, // Preserve original type
        initialQuality: 0.8, // Start with 80% quality
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)} MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      
      // If still too large, compress more aggressively
      if (compressedFile.size > MAX_FILE_SIZE) {
        const aggressiveOptions = {
          ...options,
          maxSizeMB: 3.0,
          initialQuality: 0.6,
        };
        return await imageCompression(file, aggressiveOptions);
      }
      
      return compressedFile;
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      // If compression fails, return original (will be rejected later)
      return file;
    }
  };

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
    setIsCompressing(false);
    setCompressionProgress(0);

    try {
      console.log('Starting upload via API...', { fileCount: selectedFiles.length });
      
      // Compress large images before upload
      const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
      const filesToCompress = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
      let processedFiles = [...selectedFiles];
      
      if (filesToCompress.length > 0) {
        setIsCompressing(true);
        setUploadStatus({ 
          type: 'info', 
          message: `Compressing ${filesToCompress.length} large image(s)...` 
        });
        
        // Compress files one by one with progress
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          if (file.size > MAX_FILE_SIZE) {
            const compressed = await compressImageIfNeeded(file);
            processedFiles[i] = compressed;
          }
          setCompressionProgress(Math.floor(((i + 1) / selectedFiles.length) * 100));
        }
        
        setIsCompressing(false);
        setCompressionProgress(0);
        setUploadStatus(null);
      }
      
      // Re-check file sizes after compression
      const oversizedFiles = processedFiles.filter(file => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        throw new Error(`Some images are still too large after compression: ${oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(', ')}. Please use smaller images.`);
      }
      
      // Ensure files have proper extensions and unique names
      // GIF files should have been filtered out already, but double-check
      const gifFiles = processedFiles.filter(file => file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif'));
      if (gifFiles.length > 0) {
        throw new Error('GIF files are not supported. Please remove GIF files and try again.');
      }
      
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/heic': '.heic',
        'image/heif': '.heif'
      };
      
      const usedNames = new Set();
      
      const filesToUpload = processedFiles.map((file) => {
        if (!(file instanceof File)) {
          throw new Error(`Invalid file object: ${file.name}`);
        }
        
        // Skip GIF files
        if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
          throw new Error(`GIF files are not supported: ${file.name}`);
        }
        
        const extension = mimeToExt[file.type] || '.jpg';
        let fileName = file.name;
        
        // Fix extension if needed (excluding GIF)
        if (!fileName.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)) {
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
      // For large files, use smaller batches (max 4MB per batch to be safe)
      const MAX_BATCH_SIZE = 4 * 1024 * 1024; // 4MB max per batch
      const averageFileSize = filesToUpload.reduce((sum, file) => sum + file.size, 0) / filesToUpload.length;
      
      // Check if any single file exceeds 4MB limit
      const oversizedFiles = filesToUpload.filter(file => file.size > MAX_BATCH_SIZE);
      if (oversizedFiles.length > 0) {
        throw new Error(`Files exceed the 4MB size limit: ${oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(', ')}. Please compress your images.`);
      }
      
      // Calculate batch size based on file sizes
      let BATCH_SIZE;
      if (averageFileSize > 3.5 * 1024 * 1024) {
        // Files are very large (close to 4MB limit) - one per batch
        BATCH_SIZE = 1;
      } else if (averageFileSize > 1.5 * 1024 * 1024) {
        BATCH_SIZE = 1; // One file per batch for large files
      } else if (averageFileSize > 1024 * 1024) {
        BATCH_SIZE = 2; // Two files per batch for medium files
      } else {
        // For smaller files, calculate how many can fit in 4MB
        BATCH_SIZE = Math.floor(MAX_BATCH_SIZE / averageFileSize);
        BATCH_SIZE = Math.min(BATCH_SIZE, 5); // Cap at 5 files per batch
      }
      const batches = [];
      
      for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
        batches.push(filesToUpload.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`Uploading ${filesToUpload.length} files in ${batches.length} batches (batch size: ${BATCH_SIZE}, avg file size: ${(averageFileSize / 1024 / 1024).toFixed(2)} MB)`);

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

        console.log(`Uploading batch ${batchIndex + 1}/${batches.length} (${batch.length} files)...`);
        
        // Create timeout promise (60 seconds per batch)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Upload timeout: Request took too long. Please try again or compress your images.'));
          }, 60000);
        });
        
        try {
          // Race between fetch and timeout
          const response = await Promise.race([
            fetch('/api/upload', {
              method: 'POST',
              body: formData,
              signal: signal
            }),
            timeoutPromise
          ]);
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText || `Server error (${response.status})` };
            }
            throw new Error(errorData.error || errorData.message || `Upload failed with status ${response.status}`);
          }

          const result = await response.json();
        
          if (!result.success) {
            throw new Error(result.error || result.message || 'Upload failed');
          }

          // Store transfer info from first batch
          if (batchIndex === 0) {
            transferId = result.transferId;
            transferUrl = result.transferUrl;
          }

          uploadedCount++;
          console.log(`Batch ${batchIndex + 1}/${batches.length} completed successfully`);
        } catch (batchError) {
          console.error(`Batch ${batchIndex + 1} failed:`, batchError);
          throw batchError;
        }
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
      } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        errorMessage += 'Upload took too long. Large files may take longer. Please try again or compress your images.';
      } else if (error.message?.includes('API key')) {
        errorMessage += 'Server configuration error. Please contact support.';
      } else if (error.message?.includes('413') || error.message?.includes('too large')) {
        errorMessage += 'Files are too large. Please compress your images or upload fewer files at once.';
      } else {
        errorMessage += error.message || 'Please try again. If the problem persists, try compressing your images.';
      }
      
      console.error('Upload error details:', error);
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
    
    // Check for GIF files and reject them
    const gifFiles = imageFiles.filter(file => file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif'));
    if (gifFiles.length > 0) {
      alert(`GIF files are not supported. Please remove the GIF file(s) and upload JPEG, PNG, HEIC, or WebP images instead.\n\nGIF files found: ${gifFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // Check file size limit (Vercel has 4.5MB body limit, so we limit individual files to 4MB to be safe)
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
    const oversizedFiles = imageFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      const oversizedNames = oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(', ');
      alert(`Some files are too large. Maximum file size is 4MB. Please compress your images or use smaller files.\n\nLarge files: ${oversizedNames}`);
      return;
    }
    
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
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
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
              {isCompressing && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${compressionProgress}%` }}></div>
                  </div>
                  <p className="progress-text" style={{ marginTop: '0.5rem' }}>Compressing images... {compressionProgress}%</p>
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
              {uploadStatus && !isUploading && !isCompressing && (
                <div className={`upload-status ${uploadStatus.type}`}>
                  {uploadStatus.type === 'success' ? '✓' : uploadStatus.type === 'info' ? 'ℹ' : '✗'} {uploadStatus.message}
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

