import React, { useState, useRef, useEffect, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './UploadSection.css';

// Smash API key is now handled server-side via Vercel Serverless Functions
// No API key needed in frontend - more secure!

function UploadSection({ albumIndex, selectedAlbum, orderNumber, onUploadComplete, hasError, onUploadStateChange, onFilesSelected, onUploadProgress, requestUploadStart, currentlyProcessingAlbum, onUploadStart, onUploadCancel }) {
  console.log(`[UploadSection] Component mounting/rendering for album ${albumIndex}`, {
    selectedAlbum,
    hasRequestUploadStart: !!requestUploadStart,
    currentlyProcessingAlbum,
    hasOnUploadStart: !!onUploadStart
  });

  const breakpoint = useBreakpoint();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0); // Number of files uploaded
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isQueued, setIsQueued] = useState(false); // Track if upload is queued
  const [compressionProgress, setCompressionProgress] = useState(0); // Percentage of compression progress (0-100)
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [rejectedRawFiles, setRejectedRawFiles] = useState([]); // Track rejected RAW files (File objects)
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);
  const abortControllerRef = useRef(null);
  const uploadToSmashRef = useRef(null); // Ref to store uploadToSmash function

  const maxFiles = selectedAlbum?.size || 52;

  // Notify parent of upload/compression state changes
  useEffect(() => {
    console.log(`[UploadSection] Upload state effect triggered for album ${albumIndex}`, {
      isUploading,
      isCompressing,
      hasCallback: !!onUploadStateChange
    });
    if (onUploadStateChange) {
      try {
        onUploadStateChange(isUploading || isCompressing);
      } catch (error) {
        console.error(`[UploadSection] Error in onUploadStateChange for album ${albumIndex}:`, error);
      }
    }
  }, [isUploading, isCompressing, onUploadStateChange, albumIndex]);

  // Notify parent of upload progress
  useEffect(() => {
    if (onUploadProgress && isUploading && selectedFiles.length > 0) {
      onUploadProgress(albumIndex, uploadProgress, selectedFiles.length);
    }
  }, [uploadProgress, selectedFiles.length, isUploading, albumIndex, onUploadProgress]);

  // Listen for queued upload start event
  useEffect(() => {
    console.log(`[UploadSection] Queue listener effect setting up for album ${albumIndex}`, {
      currentlyProcessingAlbum,
      hasUploadToSmash: typeof uploadToSmash === 'function'
    });
    
    const handleQueuedUpload = (event) => {
      console.log(`[UploadSection] Queue event received for album ${albumIndex}`, {
        eventAlbumIndex: event.detail?.albumIndex,
        currentlyProcessingAlbum,
        isUploading,
        isCompressing,
        selectedFilesCount: selectedFiles.length
      });
      
      if (event.detail.albumIndex === albumIndex && currentlyProcessingAlbum === albumIndex) {
        // This album is next in queue, start upload
        if (!isUploading && !isCompressing && selectedFiles.length > 0) {
          console.log(`[UploadSection] Starting queued upload for album ${albumIndex}`);
          setIsQueued(false); // Clear queued state when starting
          try {
            if (uploadToSmashRef.current) {
              uploadToSmashRef.current();
            } else {
              console.warn(`[UploadSection] uploadToSmash not available yet for album ${albumIndex}`);
            }
          } catch (error) {
            console.error(`[UploadSection] Error starting queued upload for album ${albumIndex}:`, error);
          }
        }
      }
    };
    
    try {
      window.addEventListener('startQueuedUpload', handleQueuedUpload);
      console.log(`[UploadSection] Queue listener added for album ${albumIndex}`);
    } catch (error) {
      console.error(`[UploadSection] Error adding queue listener for album ${albumIndex}:`, error);
    }
    
    return () => {
      try {
        window.removeEventListener('startQueuedUpload', handleQueuedUpload);
        console.log(`[UploadSection] Queue listener removed for album ${albumIndex}`);
      } catch (error) {
        console.error(`[UploadSection] Error removing queue listener for album ${albumIndex}:`, error);
      }
    };
  }, [albumIndex, currentlyProcessingAlbum, isUploading, isCompressing, selectedFiles.length]);

  // Check WebP browser support (cache the result)
  const supportsWebP = useCallback(() => {
    console.log(`[UploadSection] Checking WebP support for album ${albumIndex}`);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const result = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      console.log(`[UploadSection] WebP support check result for album ${albumIndex}:`, result);
      return result;
    } catch (error) {
      console.error(`[UploadSection] Error checking WebP support for album ${albumIndex}:`, error);
      return false;
    }
  }, [albumIndex]);
  
  const [webPSupported, setWebPSupported] = useState(null);
  
  useEffect(() => {
    console.log(`[UploadSection] WebP effect triggered for album ${albumIndex}`, {
      webPSupported,
      hasSupportsWebP: typeof supportsWebP === 'function'
    });
    
    if (webPSupported === null) {
      try {
        const result = supportsWebP();
        console.log(`[UploadSection] Setting WebP support for album ${albumIndex}:`, result);
        setWebPSupported(result);
      } catch (error) {
        console.error(`[UploadSection] Error in WebP effect for album ${albumIndex}:`, error);
        setWebPSupported(false);
      }
    }
  }, [supportsWebP, webPSupported, albumIndex]);

  // Compress images that are larger than 2MB
  const compressImageIfNeeded = async (file) => {
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    
    // If file is already under 2MB, return as-is
    if (file.size <= MAX_FILE_SIZE) {
      return file;
    }
    
    console.log(`Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
    
    // Target between 1.5-2MB to reduce upload time while preserving quality for A6 printing
    const TARGET_SIZE_MB = 1.75; // Middle of 1.5-2MB range
    const TARGET_SIZE = TARGET_SIZE_MB * 1024 * 1024;
    
    // For very large files (>20MB), disable web worker (can cause memory issues)
    const isVeryLarge = file.size > 20 * 1024 * 1024;
    
    let currentFile = file; // Use current file (original or previously compressed) for next attempt
    let quality = 0.85; // Start with high quality (85%)
    let maxSizeMB = TARGET_SIZE_MB; // Target 1.75MB (middle of 1.5-2MB range)
    const maxAttempts = 5;
    
    // Use cached WebP support check
    const useWebP = webPSupported === true;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Determine output type: prefer WebP if supported, otherwise JPEG
        let outputType = currentFile.type;
        if (currentFile.type === 'image/avif' || currentFile.name.toLowerCase().endsWith('.avif')) {
          // Convert AVIF to WebP or JPEG
          outputType = useWebP ? 'image/webp' : 'image/jpeg';
        } else if (useWebP && (currentFile.type === 'image/jpeg' || currentFile.type === 'image/png')) {
          // Use WebP for better compression if browser supports it
          outputType = 'image/webp';
        } else {
          // Fallback to JPEG
          outputType = 'image/jpeg';
        }
        
        const options = {
          maxSizeMB: maxSizeMB,
          maxWidthOrHeight: 2500, // Optimized for A6 printing (300 DPI needs ~1063px, 2500px provides good quality with faster compression)
          useWebWorker: !isVeryLarge, // Disable web worker for very large files (can cause memory issues)
          fileType: outputType, // Use WebP if supported, otherwise JPEG
          initialQuality: quality,
          alwaysKeepResolution: true, // Try to keep resolution, only compress quality
        };
        
        console.log(`Compression attempt ${attempt} options:`, { maxSizeMB, quality, fileSize: (currentFile.size / 1024 / 1024).toFixed(2) + ' MB', useWebWorker: options.useWebWorker });
        
        // Add timeout for compression (60 seconds per attempt for large files)
        const compressionTimeout = isVeryLarge ? 60000 : 30000;
        const compressionPromise = imageCompression(currentFile, options);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Compression timeout - file may be too large')), compressionTimeout);
        });
        
        const compressedFile = await Promise.race([compressionPromise, timeoutPromise]);
        console.log(`Attempt ${attempt}: Compressed ${file.name}: ${(currentFile.size / 1024 / 1024).toFixed(2)} MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
        
        // If file is now under 2MB, we're done
        if (compressedFile.size <= MAX_FILE_SIZE) {
          console.log(`✓ Successfully compressed ${file.name} to ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB (target: ~${TARGET_SIZE_MB} MB)`);
          return compressedFile;
        }
        
        // Update currentFile to use compressed version for next attempt
        currentFile = compressedFile;
        
        // If still too large, gradually reduce quality and target size
        if (attempt < maxAttempts) {
          // Reduce quality more gradually (by 5-10% per attempt)
          quality = Math.max(0.5, quality - (attempt === 1 ? 0.05 : 0.1)); // Small reduction first, then more
          maxSizeMB = Math.max(1.5, maxSizeMB - 0.05); // Reduce target size gradually, minimum 1.5MB
          console.log(`File still too large (${(compressedFile.size / 1024 / 1024).toFixed(2)} MB), trying slightly more compression (quality: ${quality}, maxSizeMB: ${maxSizeMB})...`);
        } else {
          // Last attempt - allow more aggressive compression if needed
          if (compressedFile.size > MAX_FILE_SIZE) {
            // Try one more time with more aggressive settings
            // Use cached WebP support for final attempt
            const useWebPFinal = webPSupported === true;
            let finalOutputType = currentFile.type;
            if (currentFile.type === 'image/avif' || currentFile.name.toLowerCase().endsWith('.avif')) {
              finalOutputType = useWebPFinal ? 'image/webp' : 'image/jpeg';
            } else if (useWebPFinal && (currentFile.type === 'image/jpeg' || currentFile.type === 'image/png')) {
              finalOutputType = 'image/webp';
            } else {
              finalOutputType = 'image/jpeg';
            }
            
            const finalOptions = {
              maxSizeMB: 2.0, // Target upper limit of range
              maxWidthOrHeight: 2500, // Optimized for A6 printing
              useWebWorker: !isVeryLarge,
              fileType: finalOutputType, // Use WebP if supported, otherwise JPEG
              initialQuality: 0.6,
              alwaysKeepResolution: false, // Allow resizing as last resort
            };
            const finalCompressed = await imageCompression(currentFile, finalOptions);
            if (finalCompressed.size <= MAX_FILE_SIZE) {
              console.log(`✓ Successfully compressed ${file.name} to ${(finalCompressed.size / 1024 / 1024).toFixed(2)} MB (final attempt)`);
              return finalCompressed;
            }
            throw new Error(`Unable to compress ${file.name} below 2MB after ${maxAttempts} attempts. Final size: ${(finalCompressed.size / 1024 / 1024).toFixed(2)} MB`);
          }
        }
      } catch (error) {
        console.error(`Compression attempt ${attempt} failed for ${file.name}:`, error);
        if (attempt === maxAttempts) {
          // Last attempt failed, throw error
          throw new Error(`Failed to compress ${file.name} after ${maxAttempts} attempts: ${error.message}`);
        }
        // Try again with more aggressive settings
        quality = Math.max(0.3, quality - 0.2);
        maxSizeMB = Math.max(1.5, maxSizeMB - 0.3);
      }
    }
    
    // Should never reach here, but just in case
    throw new Error(`Unable to compress ${file.name} below 4MB. Please use a smaller image.`);
  };

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setIsQueued(false); // Clear queued state on cancel
    setUploadProgress(0);
    setUploadStatus({ 
      type: 'error', 
      message: 'Upload cancelled by user.' 
    });
    
    // Notify parent that upload was cancelled so queue can process next item
    if (onUploadCancel) {
      onUploadCancel(albumIndex);
    }
  }, [albumIndex, onUploadCancel]);

  const uploadToSmash = useCallback(async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    
    // Double-check file count limit
    if (selectedFiles.length > maxFiles) {
      setUploadStatus({ 
        type: 'error', 
        message: `Cannot upload: You have selected ${selectedFiles.length} photos, but this album only allows ${maxFiles} photos. Please remove ${selectedFiles.length - maxFiles} photo${selectedFiles.length - maxFiles > 1 ? 's' : ''}.` 
      });
      return;
    }

    // Create new abort controller for this upload
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsUploading(true);
    setUploadProgress(0); // Reset to 0 files uploaded
    setUploadStatus(null);
    setIsCompressing(false);
    setCompressionProgress(0); // Reset to 0 files compressed

    // Declare progressInterval outside try block so it's accessible in catch/finally
    let progressInterval = null;

    try {
      console.log('Starting upload via API...', { fileCount: selectedFiles.length });
      
      // Rename files with sequential numbers based on user's order
      const renamedFiles = renameFilesWithOrder(selectedFiles);
      
      // Compress large images before upload
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
      const filesToCompress = renamedFiles.filter(file => file.size > MAX_FILE_SIZE);
      let processedFiles = [...renamedFiles];
      
      if (filesToCompress.length > 0) {
        console.log(`Found ${filesToCompress.length} files to compress:`, filesToCompress.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`));
        setIsCompressing(true);
        setUploadStatus({ 
          type: 'info', 
          message: `Compressing ${filesToCompress.length} large image(s)...` 
        });
        
        // Compress files one by one with progress
        try {
          let compressedCount = 0;
          const totalToCompress = filesToCompress.length;
          
          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
            console.log(`Processing file ${i + 1}/${selectedFiles.length}: ${file.name} (${fileSizeMB} MB)`);
            
            if (file.size > MAX_FILE_SIZE) {
              try {
                console.log(`File ${file.name} is ${fileSizeMB} MB, compressing...`);
                const compressed = await compressImageIfNeeded(file);
                const compressedSizeMB = (compressed.size / 1024 / 1024).toFixed(2);
                console.log(`Compression complete: ${file.name} → ${compressedSizeMB} MB`);
                
                // Verify compression was successful
                if (compressed.size > MAX_FILE_SIZE) {
                  throw new Error(`${file.name} could not be compressed below 2MB. Final size: ${compressedSizeMB} MB`);
                }
                
                // Convert Blob to File if needed (browser-image-compression returns Blob)
                let compressedFile = compressed;
                if (compressed instanceof Blob && !(compressed instanceof File)) {
                  compressedFile = new File([compressed], file.name, {
                    type: file.type,
                    lastModified: file.lastModified || Date.now()
                  });
                  console.log(`Converted compressed Blob to File object for ${file.name}`);
                }
                
                processedFiles[i] = compressedFile;
                compressedCount++;
                
                // Update progress based on actual compression progress
                const progressPercent = totalToCompress > 0 ? (compressedCount / totalToCompress) * 100 : 100;
                setCompressionProgress(progressPercent);
                console.log(`Compression progress: ${compressedCount}/${totalToCompress} images compressed (${progressPercent.toFixed(1)}%)`);
              } catch (compressionError) {
                console.error(`Compression failed for ${file.name}:`, compressionError);
                setIsCompressing(false);
                setCompressionProgress(0);
                throw compressionError;
              }
            } else {
              console.log(`File ${file.name} is already under 2MB (${fileSizeMB} MB), skipping compression`);
            }
          }
          
          console.log('All files processed. Compression complete.');
          setIsCompressing(false);
          setCompressionProgress(0);
          setUploadStatus(null);
        } catch (compressionError) {
          console.error('Compression error:', compressionError);
          setIsCompressing(false);
          setCompressionProgress(0);
          throw compressionError;
        }
      }
      
      // Final verification: Re-check file sizes after compression
      const oversizedFiles = processedFiles.filter(file => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        throw new Error(`Some images are still too large after compression: ${oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(', ')}. Please use smaller images.`);
      }
      
      // Ensure files have proper extensions and unique names
      // Validate file types before upload (double-check for any unsupported formats)
      const supportedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'image/heic', 'image/heif', 'image/avif'
      ];
      const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif'];
      const unsupportedFormats = ['gif', 'bmp', 'tiff', 'tif', 'svg', 'dng'];
      
      // Check for DNG files specifically
      const dngFiles = processedFiles.filter(file => 
        file.name.toLowerCase().endsWith('.dng') || 
        file.type === 'image/x-adobe-dng' || 
        file.type === 'image/dng'
      );
      
      if (dngFiles.length > 0) {
        const dngNames = dngFiles.map(f => f.name).join(', ');
        throw new Error(`DNG (RAW) files are not supported: ${dngNames}\n\nBrowsers cannot convert RAW image files. Please convert your DNG files to JPEG first using Adobe Lightroom, Photoshop, or an online converter.`);
      }
      
      const invalidFiles = processedFiles.filter(file => {
        if (!(file instanceof File)) {
          return true;
        }
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
        
        return (!hasSupportedType && !hasSupportedExtension) || hasUnsupportedExtension || isUnsupportedType;
      });
      
      if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map(f => f.name).join(', ');
        throw new Error(`Unsupported image format detected: ${invalidNames}\n\nSupported formats: JPEG, PNG, WebP, HEIC, HEIF, AVIF\n\nPlease convert these files to a supported format and try again.`);
      }
      
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/heic': '.heic',
        'image/heif': '.heif',
        'image/avif': '.avif'
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
        
        // Fix extension if needed
        if (!fileName.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic|heif|avif)$/i)) {
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
      
      // Files should already be under 4MB after compression check above
      // Double-check for safety
      const stillOversized = filesToUpload.filter(file => file.size > MAX_BATCH_SIZE);
      if (stillOversized.length > 0) {
        throw new Error(`Files exceed the 4MB size limit: ${stillOversized.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(', ')}. Please compress your images.`);
      }
      
      // Create batches dynamically, ensuring each batch doesn't exceed MAX_BATCH_SIZE
      // Account for FormData overhead (~100KB per file)
      const FORM_DATA_OVERHEAD = 100 * 1024; // ~100KB per file for FormData overhead
      const batches = [];
      let currentBatch = [];
      let currentBatchSize = 0;
      
      for (const file of filesToUpload) {
        const fileSizeWithOverhead = file.size + FORM_DATA_OVERHEAD;
        
        // If adding this file would exceed the limit, start a new batch
        if (currentBatch.length > 0 && currentBatchSize + fileSizeWithOverhead > MAX_BATCH_SIZE) {
          batches.push(currentBatch);
          currentBatch = [file];
          currentBatchSize = fileSizeWithOverhead;
        } else {
          currentBatch.push(file);
          currentBatchSize += fileSizeWithOverhead;
        }
      }
      
      // Don't forget the last batch
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }
      
      // Verify all batches are within limit and log batch info
      const batchSizes = batches.map(batch => {
        const size = batch.reduce((sum, file) => sum + file.size + FORM_DATA_OVERHEAD, 0);
        return { count: batch.length, sizeMB: (size / 1024 / 1024).toFixed(2) };
      });
      
      const oversizedBatches = batchSizes.filter(b => b.sizeMB > 4.5);
      if (oversizedBatches.length > 0) {
        console.warn('Some batches exceed safe limit:', oversizedBatches);
        // Re-batch oversized batches more aggressively
        const rebatched = [];
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const batchSize = batch.reduce((sum, file) => sum + file.size + FORM_DATA_OVERHEAD, 0);
          
          if (batchSize > MAX_BATCH_SIZE) {
            // Split this batch - one file per batch
            batch.forEach(file => rebatched.push([file]));
          } else {
            rebatched.push(batch);
          }
        }
        batches.length = 0;
        batches.push(...rebatched);
      }
      
      console.log(`Uploading ${filesToUpload.length} files in ${batches.length} batches (avg file size: ${(averageFileSize / 1024 / 1024).toFixed(2)} MB)`);
      batchSizes.forEach((batch, idx) => {
        console.log(`  Batch ${idx + 1}: ${batch.count} files, ~${batch.sizeMB} MB`);
      });

      // Track progress
      let uploadedCount = 0;
      const totalFiles = filesToUpload.length;

      // Upload first batch to create transfer, then add remaining files
      let transferId = null;
      let transferUrl = null;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        let batch = batches[batchIndex];
        
        // Final safety check: verify batch size before uploading
        let batchSize = batch.reduce((sum, file) => sum + file.size + FORM_DATA_OVERHEAD, 0);
        
        // If batch still exceeds limit, split it further (one file per batch)
        if (batchSize > MAX_BATCH_SIZE) {
          console.warn(`Batch ${batchIndex + 1} exceeds limit (${(batchSize / 1024 / 1024).toFixed(2)} MB), splitting further...`);
          // Split into individual files
          const splitBatches = batch.map(file => [file]);
          // Replace current batch with first split, insert rest after
          batch = splitBatches[0];
          batches.splice(batchIndex + 1, 0, ...splitBatches.slice(1));
          batchSize = batch.reduce((sum, file) => sum + file.size + FORM_DATA_OVERHEAD, 0);
        }
        
        const formData = new FormData();
        
        batch.forEach((file) => {
          formData.append('files', file);
        });

        // Include transferId if we already have one (for subsequent batches)
        if (transferId) {
          formData.append('transferId', transferId);
        }

        // Update progress - track number of files uploaded
        const filesUploadedSoFar = batches.slice(0, batchIndex + 1).reduce((sum, batch) => sum + batch.length, 0);
        setUploadProgress(filesUploadedSoFar);

        console.log(`Uploading batch ${batchIndex + 1}/${batches.length} (${batch.length} files, ~${(batchSize / 1024 / 1024).toFixed(2)} MB)...`);
        
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

      // Set to total files when complete
      setUploadProgress(totalFiles);
      setIsUploading(false);
      
      setUploadStatus({ 
        type: 'success', 
        message: 'Upload complete! Photos uploaded successfully. You can now proceed with your order.' 
      });
      setIsQueued(false); // Clear queued state on completion
      onUploadComplete(transferUrl, totalFiles);
      
      // Notify that this album finished (for queue processing)
      window.dispatchEvent(new CustomEvent('albumUploadFinished', { detail: { albumIndex } }));

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
      
      // Reset compression state on error
      setIsCompressing(false);
      setCompressionProgress(0);
      
      let errorMessage = 'Upload failed. ';
      
      if (error.name === 'AbortError' || signal.aborted) {
        errorMessage = 'Upload cancelled.';
      } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        errorMessage += 'Upload took too long. Large files may take longer. Please try again or compress your images.';
      } else if (error.message?.includes('API key')) {
        errorMessage += 'Server configuration error. Please contact support.';
      } else if (error.message?.includes('413') || error.message?.includes('too large')) {
        errorMessage += 'Files are too large. Please compress your images or upload fewer files at once.';
      } else if (error.message?.includes('compress') || error.message?.includes('Compression') || error.message?.includes('Unable to compress')) {
        errorMessage = error.message; // Use compression error message as-is
      } else {
        errorMessage += error.message || 'Please try again. If the problem persists, try compressing your images.';
      }
      
      console.error('Upload error details:', error);
      setUploadStatus({ type: 'error', message: errorMessage });
      setUploadProgress(0);
      setIsUploading(false);
      setIsQueued(false);
      
      // Clear queue lock on error so user can retry
      if (onUploadCancel) {
        onUploadCancel(albumIndex);
      }
    } finally {
      if (!signal.aborted) {
        setIsUploading(false);
      }
      setIsCompressing(false);
      setCompressionProgress(0);
      abortControllerRef.current = null;
    }
  }, [selectedFiles, isUploading, onUploadComplete, webPSupported]);

  // Update ref whenever uploadToSmash changes
  useEffect(() => {
    uploadToSmashRef.current = uploadToSmash;
  }, [uploadToSmash]);

  // Manual upload - no automatic trigger
  const handleUploadClick = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one photo to upload.');
      return;
    }
    if (selectedFiles.length > maxFiles) {
      alert(`You have selected ${selectedFiles.length} photos, but this album only allows ${maxFiles} photos. Please remove ${selectedFiles.length - maxFiles} photo${selectedFiles.length - maxFiles > 1 ? 's' : ''} to proceed.`);
      return;
    }
    if (isUploading || isCompressing) {
      return;
    }
    
    // Request to start upload (will queue if another album is processing)
    if (requestUploadStart) {
      const canStart = await requestUploadStart(albumIndex);
      if (!canStart) {
        // Added to queue, show message and update button state
        setIsQueued(true);
        setUploadStatus({
          type: 'info',
          message: 'Your upload is queued and will start automatically once the current upload finishes. Please wait...'
        });
        return;
      }
    }
    
    // Notify parent that upload started
    if (onUploadStart) {
      onUploadStart(albumIndex);
    }
    
    // Clear queued state when starting upload
    setIsQueued(false);
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
    
    // List of supported image formats
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/avif'
    ];
    
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif'];
    
    // Common RAW file extensions (browsers can't convert RAW files)
    const rawExtensions = ['.dng', '.cr2', '.nef', '.arw', '.orf', '.raf', '.rw2', '.srw', '.pef', '.x3f', '.3fr', '.mef', '.mos', '.ari', '.bay', '.crw', '.cap', '.dcs', '.dcr', '.drf', '.eip', '.erf', '.fff', '.iiq', '.k25', '.kdc', '.mdc', '.mrw', '.nrw', '.obm', '.ptx', '.pxn', '.r3d', '.raw', '.rwl', '.rwz', '.sr2', '.srf', '.srw', '.tif', '.x3f'];
    const rawMimeTypes = ['image/x-adobe-dng', 'image/dng', 'image/x-canon-cr2', 'image/x-nikon-nef', 'image/x-sony-arw', 'image/x-olympus-orf', 'image/x-fuji-raf', 'image/x-panasonic-rw2', 'image/x-samsung-srw', 'image/x-pentax-pef', 'image/x-sigma-x3f', 'image/x-hasselblad-3fr', 'image/x-mamiya-mef', 'image/x-leaf-mos', 'image/x-arri-ari', 'image/x-casio-bay', 'image/x-canon-crw', 'image/x-kodak-cap', 'image/x-kodak-dcs', 'image/x-kodak-dcr', 'image/x-kodak-drf', 'image/x-phaseone-eip', 'image/x-epson-erf', 'image/x-imacon-fff', 'image/x-phaseone-iiq', 'image/x-kodak-k25', 'image/x-kodak-kdc', 'image/x-minolta-mdc', 'image/x-minolta-mrw', 'image/x-nikon-nrw', 'image/x-olympus-obm', 'image/x-pentax-ptx', 'image/x-logitech-pxn', 'image/x-red-r3d', 'image/x-panasonic-raw', 'image/x-leica-rwl', 'image/x-kodak-rwz', 'image/x-sony-sr2', 'image/x-sony-srf', 'image/x-samsung-srw', 'image/x-tiff', 'image/x-sigma-x3f'];
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    // Check for RAW files (filter them out but don't reject all files)
    const rawFiles = imageFiles.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      
      // Check by extension
      const hasRawExtension = rawExtensions.some(ext => fileName.endsWith(ext));
      
      // Check by MIME type
      const hasRawMimeType = rawMimeTypes.some(mime => fileType.includes(mime));
      
      return hasRawExtension || hasRawMimeType;
    });
    
    // Filter out RAW files and other unsupported formats
    const validFiles = imageFiles.filter(file => {
      // Exclude RAW files
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      const isRaw = rawExtensions.some(ext => fileName.endsWith(ext)) || 
                    rawMimeTypes.some(mime => fileType.includes(mime));
      if (isRaw) return false;
      
      // Check for supported formats
      const hasSupportedType = supportedTypes.includes(fileType);
      const hasSupportedExtension = supportedExtensions.some(ext => fileName.endsWith(ext));
      
      // Exclude other unsupported formats
      const isGif = fileType === 'image/gif' || fileName.endsWith('.gif');
      const isBmp = fileType === 'image/bmp' || fileName.endsWith('.bmp');
      const isTiff = fileType === 'image/tiff' || fileName.match(/\.(tiff|tif)$/);
      const isSvg = fileType === 'image/svg+xml' || fileName.endsWith('.svg');
      
      // File is valid if it has supported type or extension, and is not unsupported format
      return (hasSupportedType || hasSupportedExtension) && !isGif && !isBmp && !isTiff && !isSvg;
    });
    
    // Track rejected RAW files for display (store File objects for preview)
    if (rawFiles.length > 0) {
      setRejectedRawFiles(prev => [...prev, ...rawFiles]);
    }
    
    // If no valid files after filtering, show error
    if (validFiles.length === 0 && imageFiles.length > 0) {
      if (rawFiles.length > 0) {
        const rawNames = rawFiles.map(f => f.name).join(', ');
        alert(`RAW image files cannot be uploaded!\n\nRAW files found:\n${rawNames}\n\nBrowsers cannot convert RAW image files. Please convert them to JPEG first using:\n- Adobe Lightroom\n- Adobe Photoshop\n- Online converters (e.g., CloudConvert, Zamzar)\n- Your camera/phone's built-in converter\n\nSupported formats: JPEG, PNG, WebP, HEIC, HEIF, AVIF`);
      } else {
        alert('No supported image files found. Supported formats: JPEG, PNG, WebP, HEIC, HEIF, AVIF');
      }
      return;
    }
    
    // Continue with valid files only
    const filesToProcess = validFiles;
    
    // Note: Large files will be automatically compressed when user clicks "Upload Photos"
    // No need to block file selection here - compression happens during upload
    
    // If we already have uploaded files and are adding more, reset upload status
    const willResetUpload = uploadStatus?.type === 'success';
    
    // Allow selecting more than maxFiles, but we'll show an error and disable upload
    // Don't block selection - let them see all files and remove some

    // Handle duplicate file names by adding unique identifiers
    const newFiles = filesToProcess.map(file => {
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

    setSelectedFiles(prev => {
      const updated = [...prev, ...newFiles];
      // Notify parent that files are selected
      if (onFilesSelected && updated.length > 0) {
        onFilesSelected(true);
      }
      return updated;
    });
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
    // Don't allow removing files after upload is complete or during upload/compression
    if (uploadStatus?.type === 'success' || isUploading || isCompressing) {
      return;
    }
    
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    // If all files removed, clear upload status and notify parent
    if (newFiles.length === 0) {
      setUploadStatus(null);
      setUploadProgress(0);
      // Clear the transfer URL in parent component
      onUploadComplete(null, 0);
      // Notify parent that files are cleared
      if (onFilesSelected) {
        onFilesSelected(false);
      }
    }
  };
  
  const clearAllFiles = () => {
    if (isUploading) {
      cancelUpload();
    }
    
    setSelectedFiles([]);
    setUploadStatus(null);
    setUploadProgress(0);
    setRejectedRawFiles([]); // Clear rejected RAW files list
    onUploadComplete(null, 0);
    
    // Notify parent that files are cleared
    if (onFilesSelected) {
      onFilesSelected(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const moveFileUp = (index) => {
    if (index === 0 || uploadStatus?.type === 'success' || isUploading || isCompressing) return;
    const newFiles = [...selectedFiles];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setSelectedFiles(newFiles);
  };

  const moveFileDown = (index) => {
    if (index === selectedFiles.length - 1 || uploadStatus?.type === 'success' || isUploading || isCompressing) return;
    const newFiles = [...selectedFiles];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setSelectedFiles(newFiles);
  };

  const handleFileDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newFiles = [...selectedFiles];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);
    setSelectedFiles(newFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
// hello
  // Rename files with sequential numbers and order number before upload 
  const renameFilesWithOrder = (files) => {
    if (!orderNumber) {
      console.warn('Order number not available, using timestamp as fallback');
      const fallbackOrderNumber = Date.now().toString();
      return files.map((file, index) => {
        const lastDot = file.name.lastIndexOf('.');
        const extension = lastDot !== -1 ? file.name.substring(lastDot) : '';
        const paddedNumber = String(index + 1).padStart(2, '0');
        const newName = `photo_${paddedNumber}_${fallbackOrderNumber}${extension}`;
        return new File([file], newName, { type: file.type });
      });
    }
    
    return files.map((file, index) => {
      // Get file extension
      const lastDot = file.name.lastIndexOf('.');
      const extension = lastDot !== -1 ? file.name.substring(lastDot) : '';
      
      // Create new filename: photo_01_ordernumber.extension
      const paddedNumber = String(index + 1).padStart(2, '0');
      const newName = `photo_${paddedNumber}_${orderNumber}${extension}`;
      
      // Create new File object with renamed file
      return new File([file], newName, { type: file.type });
    });
  };

  return (
    <section id={`upload-photos-${albumIndex}`} className={`upload-section ${hasError ? 'has-error' : ''}`}>
      <div className="container">
        <h2 className="section-title">
          Album {albumIndex + 1} - Upload Your Photos
          {hasError && <span className="error-badge" title="This step needs to be completed">⚠</span>}
        </h2>
        {!selectedAlbum ? (
          <div className="upload-disabled-message">
            <p>Please select an album size above to enable photo uploads.</p>
            <p className="upload-note">The number of photos you can upload depends on the album size you choose.</p>
          </div>
        ) : (
          <>
            <div className="upload-instructions">
              <p>Select and upload your photos directly (up to {maxFiles} photos):</p>
              <p className="upload-note">You can select multiple photos at once. Supported formats: JPG, JPEG, PNG, WebP, HEIC, HEIF, AVIF</p>
            </div>
            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/avif,.avif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              {selectedFiles.length === 0 && (
                <p style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-dark)', textAlign: 'center', lineHeight: '1.5' }}>
                  📸 <strong>Tip:</strong> The order you select your photos is how they'll be printed and filled in your album. Don't worry—you can use the up/down arrows to reorder them after selection if needed!
                </p>
              )}
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
                <>
                  {rejectedRawFiles.length > 0 && (
                    <div style={{ 
                      marginTop: '1.5rem',
                      marginBottom: '1rem', 
                      padding: '0.75rem', 
                      backgroundColor: '#fff3cd', 
                      border: '1px solid #ffc107', 
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}>
                      <p style={{ margin: 0, marginBottom: '0.5rem', color: '#856404', fontWeight: '500' }}>
                        ⚠️ The following RAW image files were not added:
                      </p>
                      <div style={{ 
                        maxHeight: rejectedRawFiles.length > 5 ? '200px' : 'none',
                        overflowY: rejectedRawFiles.length > 5 ? 'auto' : 'visible',
                        marginTop: '0.5rem'
                      }}>
                        {rejectedRawFiles.map((file, idx) => (
                          <RawFileItem key={idx} file={file} formatFileSize={formatFileSize} />
                        ))}
                      </div>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#856404', fontSize: '0.85rem' }}>
                        RAW files need to be converted to JPEG first then selected again.
                      </p>
                    </div>
                  )}
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.95rem', 
                        fontWeight: '700',
                        color: selectedFiles.length > maxFiles ? '#e74c3c' : 'var(--text-dark)'
                      }}>
                        {selectedFiles.length} of {maxFiles} selected
                      </p>
                    </div>
                    {selectedFiles.length > maxFiles && (
                      <div style={{ 
                        marginBottom: '1rem', 
                        padding: '0.75rem', 
                        backgroundColor: '#fee', 
                        border: '1px solid #e74c3c', 
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                      }}>
                        <p style={{ margin: 0, color: '#e74c3c', fontWeight: '500' }}>
                          ⚠️ You have selected {selectedFiles.length} photos, but this album only allows {maxFiles} photos.
                        </p>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#c33', fontSize: '0.85rem' }}>
                          Please remove {selectedFiles.length - maxFiles} photo{selectedFiles.length - maxFiles > 1 ? 's' : ''} to proceed with upload.
                        </p>
                      </div>
                    )}
                    <p style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--pastel-green-dark)', fontWeight: '500' }}>
                      ✓ The below images you selected have been added successfully, waiting for you to upload them.
                    </p>
                    <p style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                      💡 Images are listed in your selection order. Want to change it? Use the up/down arrows (↑↓) on the right to reorder.
                    </p>
                    <div className="file-list" style={{ marginTop: '0.5rem' }}>
                      {selectedFiles.map((file, index) => (
                        <FileItem
                          key={`${file.name}-${index}`}
                          file={file}
                          index={index}
                        onRemove={removeFile}
                        formatFileSize={formatFileSize}
                        isUploadComplete={uploadStatus?.type === 'success' || isUploading || isCompressing || isQueued}
                        onDragStart={handleDragStart}
                        onDragOver={handleFileDragOver}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedIndex === index}
                        onMoveUp={moveFileUp}
                        onMoveDown={moveFileDown}
                        canMoveUp={index > 0}
                        canMoveDown={index < selectedFiles.length - 1}
                        isUploading={isUploading || isCompressing || isQueued}
                        isQueued={isQueued}
                        />
                      ))}
                    </div>
                    {!isUploading && uploadStatus?.type !== 'success' && (
                      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                        {selectedFiles.length > maxFiles && (
                          <p style={{ margin: 0, color: '#e74c3c', fontSize: '0.9rem', fontWeight: '500' }}>
                            Cannot upload: Too many photos selected
                          </p>
                        )}
                        <button 
                          onClick={handleUploadClick}
                          className="btn btn-primary"
                          disabled={selectedFiles.length > maxFiles || isQueued || isUploading || isCompressing}
                          style={{ 
                            padding: '0.75rem 2rem', 
                            fontSize: '1rem',
                            opacity: (selectedFiles.length > maxFiles || isQueued || isUploading || isCompressing) ? 0.5 : 1,
                            cursor: (selectedFiles.length > maxFiles || isQueued || isUploading || isCompressing) ? 'not-allowed' : 'pointer',
                            backgroundColor: isQueued ? '#95a5a6' : undefined
                          }}
                        >
                          {isQueued ? '⏳ Upload Queued' : isUploading || isCompressing ? 'Uploading...' : 'Upload Photos'}
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
                  </div>
                </>
              )}
              {isCompressing && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${compressionProgress}%` }}></div>
                  </div>
                  <p className="progress-text" style={{ marginTop: '0.5rem' }}>Compressing images...</p>
                  <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--pastel-green-dark)', fontStyle: 'italic', textAlign: 'center' }}>
                    💡 You can continue the process and scroll down to customize your cover while compression is in progress.
                  </p>
                </div>
              )}
              {isUploading && (
                <div className="upload-progress">
                  <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                    ⏱️ This may take a few minutes depending on your internet connection speed and image sizes.
                  </p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(uploadProgress / selectedFiles.length) * 100}%` }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <p className="progress-text">Uploading... {uploadProgress} of {selectedFiles.length} images</p>
                    <button 
                      onClick={cancelUpload}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      Cancel Upload
                    </button>
                  </div>
                  {!isCompressing && (
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--pastel-green-dark)', fontStyle: 'italic', textAlign: 'center' }}>
                      💡 You can continue the process and scroll down to customize your cover while upload is in progress.
                    </p>
                  )}
                </div>
              )}
              {uploadStatus && !isUploading && !isCompressing && (
                <div className={`upload-status ${uploadStatus.type}`} style={{
                  ...(uploadStatus.type === 'info' && isQueued ? {
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    border: '2px solid #2196f3',
                    borderRadius: '12px',
                    padding: '1rem 1.5rem',
                    marginTop: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    color: '#1565c0',
                    boxShadow: '0 2px 8px rgba(33, 150, 243, 0.15)'
                  } : {})
                }}>
                  {uploadStatus.type === 'success' ? '✓' : uploadStatus.type === 'info' ? (isQueued ? '⏳' : 'ℹ') : '✗'} {uploadStatus.message}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FileItem({ file, index, onRemove, formatFileSize, isUploadComplete, onDragStart, onDragOver, onDragEnd, isDragging, onMoveUp, onMoveDown, canMoveUp, canMoveDown, isUploading, isQueued = false }) {
  const [preview, setPreview] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef(null);

  // Generate thumbnail (small preview) instead of full-size image
  const generateThumbnail = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for thumbnail
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate thumbnail size (max 200x200px, maintain aspect ratio)
          const maxSize = 200;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob URL (more memory efficient than base64)
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              reject(new Error('Failed to create thumbnail'));
            }
          }, 'image/jpeg', 0.85); // Use JPEG with 85% quality for smaller size
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!itemRef.current || preview) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before item is visible
        threshold: 0.1
      }
    );

    observer.observe(itemRef.current);

    return () => {
      observer.disconnect();
    };
  }, [preview]);

  // Generate thumbnail when item becomes visible
  useEffect(() => {
    if (!isVisible || preview) return;

    let thumbnailUrl = null;
    let cancelled = false;

    // Generate thumbnail with small delay to batch process
    const timeoutId = setTimeout(() => {
      generateThumbnail(file)
        .then((url) => {
          if (!cancelled) {
            thumbnailUrl = url;
            setPreview(url);
          }
        })
        .catch((error) => {
          console.error('Failed to generate thumbnail:', error);
          // Fallback: use object URL directly (less memory efficient but works)
          if (!cancelled) {
            const fallbackUrl = URL.createObjectURL(file);
            thumbnailUrl = fallbackUrl;
            setPreview(fallbackUrl);
          }
        });
    }, index * 50); // Stagger by 50ms per item to avoid overwhelming browser

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      // Clean up object URL
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [isVisible, file, index, generateThumbnail, preview]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleDragStartLocal = (e) => {
    if (isUploadComplete || isQueued) return;
    // Don't call preventDefault here as it prevents dragging
    onDragStart(index);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a transparent 1x1 pixel image to use as drag image
    // This prevents mobile browsers from using text content for search
    const dragImage = document.createElement('img');
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    dragImage.style.width = '1px';
    dragImage.style.height = '1px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    // Remove the temporary image after a short delay
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    // Prevent mobile browsers from treating drag data as a search query
    // Use formats that browsers won't interpret as URLs or search queries
    try {
      // Use custom MIME type for our internal use
      e.dataTransfer.setData('application/x-drag-item', String(index));
      // Use a non-searchable format: Zero-width spaces make it non-searchable
      e.dataTransfer.setData('text/plain', '\u200B\u200B'); // Zero-width spaces only
      // Set empty text/html to prevent any HTML interpretation
      e.dataTransfer.setData('text/html', '');
    } catch (err) {
      // Fallback: use zero-width space to make it non-searchable
      try {
        e.dataTransfer.setData('text/plain', '\u200B\u200B'); // Zero-width spaces
        e.dataTransfer.setData('text/html', '');
      } catch (e2) {
        // Ignore if dataTransfer is not available
      }
    }
    e.stopPropagation();
  };

  const handleDragOverLocal = (e) => {
    if (isUploadComplete || isQueued) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling that might cause navigation
    e.dataTransfer.dropEffect = 'move';
    onDragOver(e, index);
  };

  // Handle drag over on the file item (for receiving drops)
  const handleFileItemDragOver = (e) => {
    if (isUploadComplete || isQueued) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Only call onDragOver if this item is not the one being dragged
    if (!isDragging) {
      onDragOver(e, index);
    }
  };

  const handleDragEndLocal = () => {
    if (isUploadComplete || isQueued) return;
    onDragEnd();
  };

  return (
    <div 
      ref={itemRef}
      className={`file-item ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleFileItemDragOver}
      style={{
        opacity: isDragging ? 0.5 : 1,
        minHeight: preview ? 'auto' : '60px' // Reserve space while loading
      }}
    >
      <div className="file-info">
        {preview ? (
          <img 
            className="file-icon" 
            src={preview} 
            alt="Preview" 
            loading="lazy"
            style={{ objectFit: 'cover', width: '60px', height: '60px' }}
          />
        ) : (
          <div 
            className="file-icon" 
            style={{ 
              width: '60px', 
              height: '60px', 
              backgroundColor: '#f0f0f0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '4px',
              color: '#999',
              fontSize: '0.75rem'
            }}
          >
            Loading...
          </div>
        )}
        <div className="file-details">
          <div className="file-name">
            {file.name}
          </div>
          <div className="file-size">{formatFileSize(file.size)}</div>
        </div>
      </div>
      <div className="file-actions">
        {!isUploadComplete && (
          <div className="reorder-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => onMoveUp(index)}
              disabled={!canMoveUp || isUploadComplete || isUploading || isQueued}
              className="reorder-btn"
              aria-label="Move up"
              title={isUploadComplete || isUploading || isQueued ? 'Files are locked during upload' : 'Move up'}
              style={{
                padding: '0.25rem',
                border: 'none',
                background: 'transparent',
                cursor: (canMoveUp && !isUploadComplete && !isUploading && !isQueued) ? 'pointer' : 'not-allowed',
                opacity: (canMoveUp && !isUploadComplete && !isUploading && !isQueued) ? 1 : 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onMoveDown(index)}
              disabled={!canMoveDown || isUploadComplete || isUploading || isQueued}
              className="reorder-btn"
              aria-label="Move down"
              title={isUploadComplete || isUploading || isQueued ? 'Files are locked during upload' : 'Move down'}
              style={{
                padding: '0.25rem',
                border: 'none',
                background: 'transparent',
                cursor: (canMoveDown && !isUploadComplete && !isUploading && !isQueued) ? 'pointer' : 'not-allowed',
                opacity: (canMoveDown && !isUploadComplete && !isUploading && !isQueued) ? 1 : 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        )}
        <button 
          className="file-remove" 
          onClick={() => onRemove(index)} 
          aria-label="Remove file"
          disabled={isUploadComplete || isUploading || isQueued}
          style={{ 
            opacity: (isUploadComplete || isUploading || isQueued) ? 0.5 : 1,
            cursor: (isUploadComplete || isUploading || isQueued) ? 'not-allowed' : 'pointer',
            pointerEvents: (isUploadComplete || isUploading || isQueued) ? 'none' : 'auto'
          }}
          title={(isUploadComplete || isUploading || isQueued) ? 'Files are locked during upload. Use "Clear All" to start over.' : 'Remove file'}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function RawFileItem({ file, formatFileSize }) {
  // RAW files cannot be previewed in browsers, so always show placeholder
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.5rem',
      marginBottom: '0.5rem',
      backgroundColor: '#fff',
      borderRadius: '4px',
      border: '1px solid #ffc107'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '4px',
        backgroundColor: '#e9ecef',
        border: '1px solid #dee2e6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '0.6rem',
        color: '#6c757d',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: '1.1'
      }}>
        <span>📷</span>
        <span style={{ fontSize: '0.5rem', marginTop: '2px' }}>RAW</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.9rem', color: '#856404', fontWeight: '500', wordBreak: 'break-word' }}>
          {file.name}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
          {formatFileSize(file.size)}
        </div>
      </div>
    </div>
  );
}

export default UploadSection;


