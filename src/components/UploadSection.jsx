import React, { useState, useRef, useEffect } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './UploadSection.css';

// Smash API key is now handled server-side via Vercel Serverless Functions
// No API key needed in frontend - more secure!

function UploadSection({ selectedAlbum, onUploadComplete }) {
  const breakpoint = useBreakpoint();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);

  const maxFiles = selectedAlbum?.size || 50;

  useEffect(() => {
    if (selectedFiles.length > 0 && !isUploading) {
      // Small delay to ensure files are fully loaded
      const timer = setTimeout(() => {
        uploadToSmash();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedFiles]);

  const handleFileSelect = (files) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
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

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropzoneRef.current?.classList.remove('dragover');
    if (!isUploading) {
      handleFileSelect(e.dataTransfer.files);
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
    if (isUploading) return;
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length === 1) {
      setUploadStatus(null);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadToSmash = async () => {
    if (selectedFiles.length === 0 || isUploading) return;

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

      // Create FormData to send files to our API
      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append('files', file);
      });

      // Simulate progress (since we can't track server-side progress easily)
      // Update progress gradually
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);

      // Send files to our serverless function
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Upload failed');
      }

      const result = await response.json();

      if (!result.success || !result.transferUrl) {
        throw new Error('Upload completed but no transfer URL received');
      }

      setUploadProgress(100);
      setUploadStatus({ 
        type: 'success', 
        message: 'Photos uploaded successfully! You can now proceed with your order.' 
      });
      onUploadComplete(result.transferUrl, result.fileCount || selectedFiles.length);

    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Upload failed. ';
      
      if (error.message?.includes('timeout')) {
        errorMessage += 'Upload took too long. Please try with fewer or smaller files.';
      } else if (error.message?.includes('API key')) {
        errorMessage += 'Server configuration error. Please contact support.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      setUploadStatus({ type: 'error', message: errorMessage });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section id="upload-photos" className="upload-section">
      <div className="container">
        <h2 className="section-title">Upload Your Photos</h2>
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
                />
              ))}
            </div>
          )}
          {isUploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="progress-text">Uploading... {uploadProgress}%</p>
            </div>
          )}
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.type}`}>
              {uploadStatus.type === 'success' ? '✓' : '✗'} {uploadStatus.message}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FileItem({ file, index, onRemove, formatFileSize }) {
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
      <button className="file-remove" onClick={() => onRemove(index)} aria-label="Remove file">
        ×
      </button>
    </div>
  );
}

export default UploadSection;

