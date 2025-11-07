/**
 * Vercel Serverless Function for Smash API uploads
 * This keeps the Smash API key secure on the server side
 * 
 * Uses Smash SDK for Node.js instead of REST API calls
 */

import busboy from 'busboy';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Smash API key from environment variables (server-side only)
    const SMASH_API_KEY = process.env.SMASH_API_KEY || process.env.VITE_SMASH_API_KEY;
    const SMASH_REGION = process.env.SMASH_REGION || process.env.VITE_SMASH_REGION || 'eu-west-3';

    if (!SMASH_API_KEY || SMASH_API_KEY === 'YOUR_SMASH_API_KEY') {
      console.error('SMASH_API_KEY not configured');
      return res.status(500).json({ error: 'Smash API key not configured' });
    }


    // Parse multipart/form-data using busboy
    const files = [];
    let existingTransferId = null;

    return new Promise((resolve) => {
      try {
        const bb = busboy({ headers: req.headers });

        // Handle form fields (like transferId for batch uploads)
        bb.on('field', (name, value) => {
          if (name === 'transferId') {
            existingTransferId = value;
          }
        });

        bb.on('file', (name, file, info) => {
          const { filename, encoding, mimeType } = info;
          const chunks = [];
          
          file.on('data', (data) => {
            chunks.push(data);
          });
          
          file.on('end', () => {
            // Create File-like object for Smash SDK
            const fileData = Buffer.concat(chunks);
            files.push({
              name: filename,
              type: mimeType,
              data: fileData,
              size: fileData.length,
              // Create a File-like object that Smash SDK can use
              stream: () => {
                const { Readable } = require('stream');
                return Readable.from([fileData]);
              }
            });
          });
        });

        bb.on('finish', async () => {
          try {
            if (files.length === 0) {
              res.status(400).json({ error: 'No files provided' });
              resolve();
              return;
            }

            console.log(`Processing ${files.length} files`);

            // Import and initialize Smash SDK
            console.log('Importing Smash SDK...');
            const smashModule = await import('@smash-sdk/uploader');
            
            console.log('Smash module keys:', Object.keys(smashModule));
            console.log('Smash module default:', typeof smashModule.default);
            console.log('Smash module SmashUploader:', typeof smashModule.SmashUploader);
            
            // Try different ways to get SmashUploader constructor
            const SmashUploader = smashModule.SmashUploader || 
                                 smashModule.default?.SmashUploader ||
                                 smashModule.default ||
                                 smashModule.Uploader ||
                                 smashModule;
            
            console.log('SmashUploader type:', typeof SmashUploader);
            console.log('Is constructor?', typeof SmashUploader === 'function');
            
            if (typeof SmashUploader !== 'function') {
              throw new Error('SmashUploader is not a constructor. Module structure: ' + JSON.stringify(Object.keys(smashModule)));
            }
            
            console.log('Initializing Smash uploader...');
            const uploader = new SmashUploader({
              region: SMASH_REGION,
              token: SMASH_API_KEY
            });

            // Smash SDK expects file paths (strings), not File objects
            // Write files to /tmp directory (Vercel provides this)
            const fs = await import('fs/promises');
            const path = await import('path');
            const os = await import('os');
            
            const tmpDir = os.tmpdir();
            const filePaths = [];
            const tempFiles = [];
            
            try {
              console.log('Writing files to temp directory...');
              for (const file of files) {
                // Create unique filename to avoid conflicts
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(7);
                const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const tempFilePath = path.join(tmpDir, `${timestamp}_${random}_${safeFileName}`);
                
                // Write buffer to temp file
                await fs.writeFile(tempFilePath, file.data);
                filePaths.push(tempFilePath);
                tempFiles.push(tempFilePath);
                
                console.log(`Written temp file: ${tempFilePath}`);
              }

              console.log(`Starting Smash upload with ${filePaths.length} files...`);
              // Pass file paths (strings) to Smash SDK
              const result = await uploader.upload({ files: filePaths });
              
              console.log('Upload result:', result);
              
              const transferUrl = result.transfer?.transferUrl || result.transferUrl || `https://fromsmash.com/${result.transfer?.id || result.id}`;
              const transferId = result.transfer?.id || result.id;

              if (!transferUrl) {
                throw new Error('No transfer URL received from Smash');
              }

              res.status(200).json({
                success: true,
                transferUrl: transferUrl,
                transferId: transferId,
                fileCount: files.length,
              });
              resolve();
            } finally {
              // Always clean up temp files, even if upload fails
              console.log('Cleaning up temp files...');
              for (const tempFile of tempFiles) {
                try {
                  await fs.unlink(tempFile);
                  console.log(`Deleted temp file: ${tempFile}`);
                } catch (cleanupError) {
                  console.warn(`Failed to delete temp file ${tempFile}:`, cleanupError.message);
                }
              }
            }
          } catch (error) {
            console.error('Upload processing error:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({
              error: 'Upload failed',
              message: error.message || 'Unknown error occurred',
            });
            resolve();
          }
        });

        bb.on('error', (error) => {
          console.error('Busboy parsing error:', error);
          res.status(500).json({
            error: 'File parsing failed',
            message: error.message,
          });
          resolve();
        });

        // Pipe request to busboy
        console.log('Starting to pipe request to busboy');
        try {
          if (typeof req.pipe === 'function') {
            req.pipe(bb);
            console.log('Request piped successfully');
          } else {
            console.error('Request object does not have pipe method');
            res.status(500).json({ 
              error: 'Server configuration error',
              details: 'Request streaming not supported'
            });
            resolve();
          }
        } catch (pipeError) {
          console.error('Error piping request:', pipeError);
          res.status(500).json({ 
            error: 'Failed to process request',
            message: pipeError.message 
          });
          resolve();
        }
      } catch (error) {
        console.error('Handler setup error:', error);
        res.status(500).json({
          error: 'Request processing failed',
          message: error.message || 'Unknown error occurred',
        });
        resolve();
      }
    });
  } catch (error) {
    console.error('Outer handler error:', error);
    return res.status(500).json({
      error: 'Request processing failed',
      message: error.message || 'Unknown error occurred',
    });
  }
}
