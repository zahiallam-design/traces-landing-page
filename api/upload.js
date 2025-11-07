/**
 * Vercel Serverless Function for Smash API uploads
 * This keeps the Smash API key secure on the server side
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get Smash API key from environment variables (server-side only)
  const SMASH_API_KEY = process.env.SMASH_API_KEY || process.env.VITE_SMASH_API_KEY;
  const SMASH_REGION = process.env.SMASH_REGION || process.env.VITE_SMASH_REGION || 'eu-west-3';

  if (!SMASH_API_KEY || SMASH_API_KEY === 'YOUR_SMASH_API_KEY') {
    console.error('SMASH_API_KEY not configured');
    return res.status(500).json({ error: 'Smash API key not configured' });
  }

  // Import busboy
  let Busboy;
  try {
    const busboyModule = await import('busboy');
    Busboy = busboyModule.default || busboyModule;
  } catch (importError) {
    console.error('Failed to import busboy:', importError);
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'Failed to load file upload library: ' + importError.message
    });
  }

  // Parse multipart/form-data using busboy
  const files = [];
  let existingTransferId = null;

  return new Promise((resolve) => {
    try {
      const bb = Busboy({ headers: req.headers });

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

          console.log(`Processing ${files.length} files`);

          // Step 1: Create a Smash transfer (or use existing if provided for batch uploads)
          let transferId = existingTransferId;
          
          if (!transferId) {
            console.log('Creating new Smash transfer...');
            // Use api.fromsmash.com instead of regional subdomain (SSL certificate issue)
            const transferResponse = await fetch(
              `https://api.fromsmash.com/v1/transfer?version=01-2024`,
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
            transferId = transferData.transfer?.id || transferData.id;

            if (!transferId) {
              console.error('No transfer ID in response:', transferData);
              res.status(500).json({ error: 'Failed to get transfer ID from Smash' });
              resolve();
              return;
            }
            console.log('Transfer created:', transferId);
          }

          // Step 2: Upload each file to the transfer
          console.log(`Uploading ${files.length} files to transfer ${transferId}`);
          const uploadPromises = files.map(async (file) => {
            // Use api.fromsmash.com instead of regional subdomain (SSL certificate issue)
            const fileResponse = await fetch(
              `https://api.fromsmash.com/v1/transfer/${transferId}/file?version=01-2024`,
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
          console.log('All files uploaded successfully');

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
        console.error('Error stack:', error.stack);
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
          console.error('Request object keys:', Object.keys(req));
          res.status(500).json({ 
            error: 'Server configuration error',
            details: 'Request streaming not supported'
          });
          resolve();
        }
      } catch (pipeError) {
        console.error('Error piping request:', pipeError);
        console.error('Pipe error stack:', pipeError.stack);
        res.status(500).json({ 
          error: 'Failed to process request',
          message: pipeError.message 
        });
        resolve();
      }
    } catch (error) {
      console.error('Handler setup error:', error);
      console.error('Setup error stack:', error.stack);
      res.status(500).json({
        error: 'Request processing failed',
        message: error.message || 'Unknown error occurred',
      });
      resolve();
    }
  });
}
