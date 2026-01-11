import React, { useState, useRef, useEffect, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './UploadSection.css';

// Smash API key is now handled server-side via Vercel Serverless Functions
// No API key needed in frontend - more secure!

function UploadSection({ albumIndex, selectedAlbum, orderNumber, onUploadComplete, hasError }) {
  const breakpoint = useBreakpoint();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);
  const abortControllerRef = useRef(null);

  const maxFiles = selectedAlbum?.size || 52;

  // Compress images that are larger than 4MB
  const compressImageIfNeeded = async (file) => {
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
    
    // If file is already under 4MB, return as-is
    if (file.size <= MAX_FILE_SIZE) {
      return file;
    }
    
    console.log(`Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
    
    // Target just below 4MB (3.8MB) to preserve quality
    const TARGET_SIZE_MB = 3.8;
    const TARGET_SIZE = TARGET_SIZE_MB * 1024 * 1024;
    
    // For very large files (>20MB), disable web worker (can cause memory issues)
    const isVeryLarge = file.size > 20 * 1024 * 1024;
    
    let currentFile = file; // Use current file (original or previously compressed) for next attempt
    let quality = 0.9; // Start with high quality (90%)
    let maxSizeMB = TARGET_SIZE_MB; // Target 3.8MB
    const maxAttempts = 5;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // For AVIF, convert to JPEG for better compression support
        let outputType = currentFile.type;
        if (currentFile.type === 'image/avif' || currentFile.name.toLowerCase().endsWith('.avif')) {
          // Convert AVIF to JPEG for better compression support
          outputType = 'image/jpeg';
        }
        
        const options = {
          maxSizeMB: maxSizeMB,
          maxWidthOrHeight: 4000, // Keep high resolution
          useWebWorker: !isVeryLarge, // Disable web worker for very large files (can cause memory issues)
          fileType: outputType, // Convert DNG/AVIF to JPEG for compression
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
        
        // If file is now under 4MB, we're done
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
          maxSizeMB = Math.max(3.0, maxSizeMB - 0.1); // Reduce target size gradually, minimum 3MB
          console.log(`File still too large (${(compressedFile.size / 1024 / 1024).toFixed(2)} MB), trying slightly more compression (quality: ${quality}, maxSizeMB: ${maxSizeMB})...`);
        } else {
          // Last attempt - allow more aggressive compression if needed
          if (compressedFile.size > MAX_FILE_SIZE) {
            // Try one more time with more aggressive settings
            const finalOptions = {
              maxSizeMB: 3.5,
              maxWidthOrHeight: 4000,
              useWebWorker: !isVeryLarge,
              fileType: (currentFile.type === 'image/avif' || currentFile.name.toLowerCase().endsWith('.avif')) ? 'image/jpeg' : currentFile.type, // Convert AVIF to JPEG
              initialQuality: 0.6,
              alwaysKeepResolution: false, // Allow resizing as last resort
            };
            const finalCompressed = await imageCompression(currentFile, finalOptions);
            if (finalCompressed.size <= MAX_FILE_SIZE) {
              console.log(`✓ Successfully compressed ${file.name} to ${(finalCompressed.size / 1024 / 1024).toFixed(2)} MB (final attempt)`);
              return finalCompressed;
            }
            throw new Error(`Unable to compress ${file.name} below 4MB after ${maxAttempts} attempts. Final size: ${(finalCompressed.size / 1024 / 1024).toFixed(2)} MB`);
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
        maxSizeMB = Math.max(2.0, maxSizeMB - 0.4);
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

    // Declare progressInterval outside try block so it's accessible in catch/finally
    let progressInterval = null;

    try {
      console.log('Starting upload via API...', { fileCount: selectedFiles.length });
      
      // Rename files with sequential numbers based on user's order
      const renamedFiles = renameFilesWithOrder(selectedFiles);
      
      // Compress large images before upload
      const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
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
                  throw new Error(`${file.name} could not be compressed below 4MB. Final size: ${compressedSizeMB} MB`);
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
                console.log(`✓ File ${file.name} successfully compressed and ready for upload`);
              } catch (compressionError) {
                console.error(`Compression failed for ${file.name}:`, compressionError);
                setIsCompressing(false);
                setCompressionProgress(0);
                throw compressionError;
              }
            } else {
              console.log(`File ${file.name} is already under 4MB (${fileSizeMB} MB), skipping compression`);
            }
            
            // Update progress
            const progress = Math.floor(((i + 1) / selectedFiles.length) * 100);
            setCompressionProgress(progress);
            console.log(`Compression progress: ${progress}%`);
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
    } finally {
      if (!signal.aborted) {
        setIsUploading(false);
      }
      setIsCompressing(false);
      setCompressionProgress(0);
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
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    // Check for DNG files specifically (browsers can't convert RAW files)
    const dngFiles = imageFiles.filter(file => 
      file.name.toLowerCase().endsWith('.dng') || 
      file.type === 'image/x-adobe-dng' || 
      file.type === 'image/dng'
    );
    
    if (dngFiles.length > 0) {
      const dngNames = dngFiles.map(f => f.name).join(', ');
      alert(`DNG (RAW) files are not supported!\n\nDNG files found:\n${dngNames}\n\nBrowsers cannot convert RAW image files. Please convert your DNG files to JPEG first using:\n- Adobe Lightroom\n- Adobe Photoshop\n- Online converters (e.g., CloudConvert, Zamzar)\n- Your camera/phone's built-in converter\n\nSupported formats: JPEG, PNG, WebP, HEIC, HEIF, AVIF`);
      return;
    }
    
    // Check for other unsupported file types
    const unsupportedFiles = imageFiles.filter(file => {
      const hasSupportedType = supportedTypes.includes(file.type.toLowerCase());
      const hasSupportedExtension = supportedExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      // If file has no type or extension doesn't match, check if it's a known unsupported format
      const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
      const isBmp = file.type === 'image/bmp' || file.name.toLowerCase().endsWith('.bmp');
      const isTiff = file.type === 'image/tiff' || file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.tif');
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
      
      // File is unsupported if:
      // 1. It's a known unsupported format (GIF, BMP, TIFF, SVG)
      // 2. OR it doesn't have a supported type AND doesn't have a supported extension
      return isGif || isBmp || isTiff || isSvg || (!hasSupportedType && !hasSupportedExtension);
    });
    
    if (unsupportedFiles.length > 0) {
      const unsupportedNames = unsupportedFiles.map(f => f.name).join(', ');
      const unsupportedTypes = unsupportedFiles.map(f => {
        if (f.type === 'image/gif' || f.name.toLowerCase().endsWith('.gif')) return 'GIF';
        if (f.type === 'image/bmp' || f.name.toLowerCase().endsWith('.bmp')) return 'BMP';
        if (f.type === 'image/tiff' || f.name.toLowerCase().match(/\.(tiff|tif)$/i)) return 'TIFF';
        if (f.type === 'image/svg+xml' || f.name.toLowerCase().endsWith('.svg')) return 'SVG';
        return f.type || 'Unknown format';
      }).join(', ');
      
      alert(`Unsupported image format detected!\n\nSupported formats: JPEG, PNG, WebP, HEIC, HEIF, AVIF\n\nUnsupported files:\n${unsupportedNames}\n\nFormat(s): ${unsupportedTypes}\n\nPlease convert these files to a supported format and try again.`);
      return;
    }
    
    // Note: Large files will be automatically compressed when user clicks "Upload Photos"
    // No need to block file selection here - compression happens during upload
    
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

  const handleDragStart = (index) => {
    setDraggedIndex(index);
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
              <p className="upload-note">You can select multiple photos at once. Supported formats: JPG, PNG, HEIC</p>
            </div>
            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/avif,.avif"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              {selectedFiles.length === 0 && (
                <p style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-dark)', textAlign: 'center', lineHeight: '1.5' }}>
                  📸 <strong>Tip:</strong> The order you select your photos is how they'll be printed and assembled in your album. Don't worry—you can drag and reorder them after selection if needed!
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
                  <p style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                    💡 Images are listed in your selection order. Want to change it? Drag the handle (☰) on the right.
                  </p>
                  <div className="file-list">
                    {selectedFiles.map((file, index) => (
                      <FileItem
                        key={`${file.name}-${index}`}
                        file={file}
                        index={index}
                        onRemove={removeFile}
                        formatFileSize={formatFileSize}
                        isUploadComplete={uploadStatus?.type === 'success'}
                        onDragStart={handleDragStart}
                        onDragOver={handleFileDragOver}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedIndex === index}
                      />
                    ))}
                  </div>
                </>
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

function FileItem({ file, index, onRemove, formatFileSize, isUploadComplete, onDragStart, onDragOver, onDragEnd, isDragging }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }, [file]);

  const handleDragStartLocal = (e) => {
    if (isUploadComplete) return;
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
    if (isUploadComplete) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling that might cause navigation
    e.dataTransfer.dropEffect = 'move';
    onDragOver(e, index);
  };

  // Handle drag over on the file item (for receiving drops)
  const handleFileItemDragOver = (e) => {
    if (isUploadComplete) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Only call onDragOver if this item is not the one being dragged
    if (!isDragging) {
      onDragOver(e, index);
    }
  };

  const handleDragEndLocal = () => {
    if (isUploadComplete) return;
    onDragEnd();
  };

  return (
    <div 
      className={`file-item ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleFileItemDragOver}
      style={{
        opacity: isDragging ? 0.5 : 1
      }}
    >
      <div className="file-info">
        {preview && <img className="file-icon" src={preview} alt="Preview" />}
        <div className="file-details">
          <div className="file-name">
            {file.name}
          </div>
          <div className="file-size">{formatFileSize(file.size)}</div>
        </div>
      </div>
      <div className="file-actions">
        {!isUploadComplete && (
          <div 
            className="drag-handle"
            draggable={true}
            onDragStart={handleDragStartLocal}
            onDragOver={handleDragOverLocal}
            onDragEnd={handleDragEndLocal}
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="12" r="1"></circle>
              <circle cx="9" cy="5" r="1"></circle>
              <circle cx="9" cy="19" r="1"></circle>
              <circle cx="15" cy="12" r="1"></circle>
              <circle cx="15" cy="5" r="1"></circle>
              <circle cx="15" cy="19" r="1"></circle>
            </svg>
          </div>
        )}
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
    </div>
  );
}

export default UploadSection;


