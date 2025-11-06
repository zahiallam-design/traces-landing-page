import React, { useState, useRef, useEffect } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './UploadSection.css';

// IMPORTANT: Replace with your Smash API key
// You can use environment variables (VITE_SMASH_API_KEY) or hardcode it here
const SMASH_API_KEY = import.meta.env.VITE_SMASH_API_KEY || 'YOUR_SMASH_API_KEY';
const SMASH_REGION = import.meta.env.VITE_SMASH_REGION || 'eu-west-3';

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

    // Check API key
    if (!SMASH_API_KEY || SMASH_API_KEY === 'YOUR_SMASH_API_KEY') {
      setUploadStatus({ 
        type: 'error', 
        message: 'Smash API key not configured. Please add VITE_SMASH_API_KEY in Vercel environment variables and redeploy.' 
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus(null);

    try {
      // Check if Smash SDK is loaded
      if (typeof SmashUploader === 'undefined') {
        throw new Error('Smash SDK not loaded. Please check the script tag in index.html');
      }

      console.log('Initializing Smash uploader...', { 
        region: SMASH_REGION, 
        hasApiKey: !!SMASH_API_KEY,
        fileCount: selectedFiles.length 
      });

      const uploader = new SmashUploader({
        region: SMASH_REGION,
        token: SMASH_API_KEY
      });

      // Set up progress listener BEFORE starting upload
      uploader.on('progress', (event) => {
        console.log('Upload progress event:', event);
        console.log('Event structure:', {
          hasData: !!event.data,
          hasProgress: !!event.data?.progress,
          hasPercent: !!event.data?.progress?.percent,
          eventKeys: Object.keys(event || {}),
          dataKeys: event.data ? Object.keys(event.data) : []
        });
        
        // Try different possible event structures from Smash SDK
        let percent = 0;
        
        if (event?.data?.progress?.percent !== undefined) {
          percent = Math.round(event.data.progress.percent);
        } else if (event?.progress?.percent !== undefined) {
          percent = Math.round(event.progress.percent);
        } else if (event?.percent !== undefined) {
          percent = Math.round(event.percent);
        } else if (event?.data?.percent !== undefined) {
          percent = Math.round(event.data.percent);
        } else if (typeof event === 'number') {
          percent = Math.round(event);
        } else {
          // If we can't find percent, log the full event for debugging
          console.warn('Could not find percent in progress event:', event);
          // Don't update progress if we can't determine it
          return;
        }
        
        console.log('Calculated progress:', percent + '%');
        setUploadProgress(percent);
      });

      // Also listen for other events for debugging
      uploader.on('error', (event) => {
        console.error('Smash uploader error event:', event);
        setUploadStatus({ 
          type: 'error', 
          message: 'Upload error: ' + (event?.message || event?.error || 'Unknown error') 
        });
      });
      
      // Listen for completion/other events
      uploader.on('complete', (event) => {
        console.log('Upload complete event:', event);
      });
      
      uploader.on('finish', (event) => {
        console.log('Upload finish event:', event);
      });

      console.log('Starting upload...');
      console.log('Files to upload:', selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      // Ensure files are proper File objects with valid extensions AND unique names
      // Smash SDK requires files to have proper extensions and unique names
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/heic': '.heic',
        'image/heif': '.heif'
      };
      
      // Track used file names to ensure uniqueness
      const usedNames = new Set();
      
      const filesToUpload = selectedFiles.map((file, index) => {
        // Verify file is still valid
        if (!(file instanceof File)) {
          throw new Error(`Invalid file object: ${file.name}`);
        }
        
        // Ensure file has proper extension matching its MIME type
        const extension = mimeToExt[file.type] || '.jpg';
        let fileName = file.name;
        
        // If file doesn't have extension or has wrong extension, fix it
        if (!fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)) {
          // Remove any existing extension and add correct one
          fileName = fileName.replace(/\.[^/.]+$/, '') + extension;
          console.log(`Fixing file extension: ${file.name} -> ${fileName}`);
        }
        
        // Ensure unique filename - if name already used, add unique suffix
        let finalFileName = fileName;
        let counter = 1;
        while (usedNames.has(finalFileName)) {
          const baseName = fileName.replace(/\.[^/.]+$/, '');
          const ext = fileName.split('.').pop();
          finalFileName = `${baseName}_${counter}.${ext}`;
          counter++;
        }
        usedNames.add(finalFileName);
        
        // If filename changed, create new File object with correct name
        if (finalFileName !== file.name) {
          console.log(`Renaming file for uniqueness: ${file.name} -> ${finalFileName}`);
          return new File([file], finalFileName, { type: file.type, lastModified: file.lastModified });
        }
        
        return file;
      });
      
      console.log('Files verified, starting upload...');
      console.log('File details:', filesToUpload.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        lastModified: f.lastModified,
        isFile: f instanceof File,
        isBlob: f instanceof Blob
      })));
      
      // Smash SDK expects an array of File objects
      // Ensure we're passing the properly formatted files
      console.log('Using files array with corrected extensions...');
      const uploadPromise = uploader.upload({ files: filesToUpload });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 5 minutes')), 300000)
      );

      const result = await Promise.race([uploadPromise, timeoutPromise]);
      
      console.log('Upload result:', result);
      
      const transferUrl = result.transfer?.transferUrl || result.transferUrl;

      if (!transferUrl) {
        throw new Error('Upload completed but no transfer URL received');
      }

      setUploadProgress(100);
      setUploadStatus({ type: 'success', message: 'Photos uploaded successfully! You can now proceed with your order.' });
      onUploadComplete(transferUrl, selectedFiles.length);

    } catch (error) {
      console.error('Smash upload error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        apiKeySet: !!SMASH_API_KEY,
        apiKeyLength: SMASH_API_KEY?.length,
        sdkLoaded: typeof SmashUploader !== 'undefined',
        fileCount: selectedFiles.length
      });
      
      let errorMessage = 'Upload failed. ';
      
      if (error.message?.includes('timeout')) {
        errorMessage += 'Upload took too long. Please try with fewer or smaller files.';
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage += 'Invalid API key. Please check your Smash API key in Vercel environment variables.';
      } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        errorMessage += 'API key access denied. Please verify your Smash account and API key permissions.';
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

