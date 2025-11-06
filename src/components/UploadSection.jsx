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
      uploadToSmash();
    }
  }, [selectedFiles]);

  const handleFileSelect = (files) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (selectedFiles.length + imageFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} photos. Please remove some files or select a different album size.`);
      return;
    }

    const newFiles = imageFiles.filter(file => 
      !selectedFiles.find(f => f.name === file.name && f.size === file.size)
    );

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

    if (!SMASH_API_KEY || SMASH_API_KEY === 'YOUR_SMASH_API_KEY') {
      setUploadStatus({ type: 'error', message: 'Please configure your Smash API key in UploadSection.jsx' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus(null);

    try {
      if (typeof SmashUploader === 'undefined') {
        throw new Error('Smash SDK not loaded. Please check the script tag in index.html');
      }

      const uploader = new SmashUploader({
        region: SMASH_REGION,
        token: SMASH_API_KEY
      });

      uploader.on('progress', (event) => {
        const percent = Math.round(event.data.progress.percent || 0);
        setUploadProgress(percent);
      });

      const result = await uploader.upload({ files: selectedFiles });
      const transferUrl = result.transfer?.transferUrl || result.transferUrl;

      setUploadProgress(100);
      setUploadStatus({ type: 'success', message: 'Photos uploaded successfully! You can now proceed with your order.' });
      onUploadComplete(transferUrl, selectedFiles.length);

    } catch (error) {
      console.error('Smash upload error:', error);
      setUploadStatus({ type: 'error', message: 'Upload failed. Please try again. ' + (error.message || '') });
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

