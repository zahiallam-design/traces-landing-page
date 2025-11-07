/**
 * Vercel Serverless Function for Smash API uploads
 * This keeps the Smash API key secure on the server side
 * 
 * Note: This function uses busboy to parse multipart/form-data
 */

import busboy from 'busboy';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Smash API key from environment variables (server-side only)
    // Use SMASH_API_KEY (without VITE_ prefix) for serverless functions
    const SMASH_API_KEY = process.env.SMASH_API_KEY || process.env.VITE_SMASH_API_KEY;
    const SMASH_REGION = process.env.SMASH_REGION || process.env.VITE_SMASH_REGION || 'eu-west-3';

    if (!SMASH_API_KEY || SMASH_API_KEY === 'YOUR_SMASH_API_KEY') {
      return res.status(500).json({ error: 'Smash API key not configured' });
    }

    // Parse multipart/form-data using busboy
    const files = [];
    
    return new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.headers });

      bb.on('file', (name, file, info) => {
        const { filename, encoding, mimeType } = info;
        const chunks = [];
        
        file.on('data', (data) => {
          chunks.push(data);
        });
        
        file.on('end', () => {
          files.push({
            name: filename,
            type: mimeType,
            data: Buffer.concat(chunks),
            size: Buffer.concat(chunks).length
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

          // Step 1: Create a Smash transfer
          const transferResponse = await fetch(
            `https://${SMASH_REGION}.api.fromsmash.com/v1/transfer?version=01-2024`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${SMASH_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: `Photo Album Upload - ${new Date().toISOString()}`,
              }),
            }
          );

          if (!transferResponse.ok) {
            const errorText = await transferResponse.text();
            console.error('Smash transfer creation failed:', errorText);
            res.status(transferResponse.status).json({ 
              error: 'Failed to create Smash transfer',
              details: errorText 
            });
            resolve();
            return;
          }

          const transferData = await transferResponse.json();
          const transferId = transferData.transfer?.id || transferData.id;

          if (!transferId) {
            res.status(500).json({ error: 'Failed to get transfer ID from Smash' });
            resolve();
            return;
          }

          // Step 2: Upload each file to the transfer
          const uploadPromises = files.map(async (file) => {
            const fileResponse = await fetch(
              `https://${SMASH_REGION}.api.fromsmash.com/v1/transfer/${transferId}/file?version=01-2024`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${SMASH_API_KEY}`,
                  'Content-Type': file.type || 'application/octet-stream',
                  'X-File-Name': file.name,
                  'X-File-Size': file.size.toString(),
                },
                body: file.data,
              }
            );

            if (!fileResponse.ok) {
              const errorText = await fileResponse.text();
              throw new Error(`Failed to upload file ${file.name}: ${errorText}`);
            }

            return await fileResponse.json();
          });

          await Promise.all(uploadPromises);

          // Step 3: Return transfer URL
          const transferUrl = `https://fromsmash.com/${transferId}`;

          res.status(200).json({
            success: true,
            transferUrl: transferUrl,
            transferId: transferId,
            fileCount: files.length,
          });
          resolve();
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
          error: 'Upload failed',
          message: error.message || 'Unknown error occurred',
        });
        reject(error);
      }
    });

      bb.on('error', (error) => {
        console.error('Busboy error:', error);
        res.status(500).json({
          error: 'File parsing failed',
          message: error.message,
        });
        reject(error);
      });

      req.pipe(bb);
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Request processing failed',
      message: error.message || 'Unknown error occurred',
    });
  }
}

