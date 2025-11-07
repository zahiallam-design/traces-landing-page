# Serverless Function Setup Guide

This guide explains how the Smash API key is now secured using Vercel Serverless Functions.

## What Changed

### Before (Insecure)
- Smash API key was exposed in frontend JavaScript
- Anyone could view it in browser DevTools
- Key was visible in the bundled code

### Now (Secure)
- Smash API key stays on the server (Vercel Serverless Function)
- Frontend calls `/api/upload` endpoint
- Server handles Smash API communication
- API key never exposed to browser

## Architecture

```
Frontend (Browser)
    ↓ (sends files)
/api/upload (Vercel Serverless Function)
    ↓ (uses SMASH_API_KEY)
Smash API
    ↓ (returns transfer URL)
/api/upload
    ↓ (returns transfer URL)
Frontend (Browser)
```

## Environment Variables Setup

### In Vercel Dashboard:

1. Go to **Settings** → **Environment Variables**

2. Add/Update these variables:

   **For Serverless Functions (Server-side only):**
   - Key: `SMASH_API_KEY`
     - Value: Your Smash API key
     - Environments: Production, Preview, Development
     - **Important**: Use `SMASH_API_KEY` (without `VITE_` prefix) for serverless functions
   
   - Key: `SMASH_REGION` (Optional)
     - Value: `eu-west-3` or `us-east-1`
     - Default: `eu-west-3`
     - Environments: Production, Preview, Development

   **You can keep `VITE_SMASH_API_KEY` as a fallback**, but the serverless function will prefer `SMASH_API_KEY`.

3. **Remove `VITE_SMASH_API_KEY` from frontend** (optional but recommended):
   - The frontend no longer needs this variable
   - Keeping it won't hurt, but removing it is cleaner

## File Structure

```
project-root/
├── api/
│   └── upload.js          # Serverless function (server-side)
├── src/
│   └── components/
│       └── UploadSection.jsx  # Frontend (calls /api/upload)
└── package.json          # Includes busboy dependency
```

## How It Works

1. **User selects files** in `UploadSection.jsx`
2. **Frontend sends files** to `/api/upload` via FormData
3. **Serverless function** (`api/upload.js`):
   - Receives files
   - Parses multipart/form-data using busboy
   - Creates Smash transfer using `SMASH_API_KEY` (server-side)
   - Uploads files to Smash
   - Returns transfer URL
4. **Frontend receives** transfer URL and continues with order

## Testing

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables** (create `.env.local`):
   ```
   SMASH_API_KEY=your_smash_api_key_here
   SMASH_REGION=eu-west-3
   ```

3. **Run dev server:**
   ```bash
   npm run dev
   ```

4. **Test upload:**
   - Select files
   - Upload should go through `/api/upload`
   - Check browser console for logs
   - Check Vercel function logs (if deployed)

### Production

1. **Deploy to Vercel** (automatic via GitHub)
2. **Set environment variables** in Vercel dashboard
3. **Test upload** on live site
4. **Verify** API key is not visible in browser DevTools

## Troubleshooting

### "Smash API key not configured"
- Check `SMASH_API_KEY` is set in Vercel environment variables
- Make sure you redeployed after adding the variable
- Check serverless function logs in Vercel dashboard

### "Failed to create Smash transfer"
- Verify `SMASH_API_KEY` is correct
- Check Smash API status
- Review serverless function logs

### Upload fails silently
- Check browser console for errors
- Check Vercel function logs
- Verify files are being sent correctly

### Files not uploading
- Check file size limits (Vercel has limits)
- Verify busboy is installed (`npm install busboy`)
- Check serverless function timeout settings

## Security Benefits

✅ **API key hidden** - Never exposed to browser  
✅ **Server-side validation** - Can add rate limiting  
✅ **Better error handling** - Centralized error management  
✅ **Logging** - Can track uploads server-side  
✅ **Future-proof** - Easy to add authentication/authorization

## Next Steps

- [ ] Set `SMASH_API_KEY` in Vercel environment variables
- [ ] Deploy and test upload functionality
- [ ] Verify API key is not visible in browser
- [ ] Monitor serverless function logs
- [ ] (Optional) Remove `VITE_SMASH_API_KEY` from frontend env vars

## Notes

- The serverless function uses `busboy` to parse multipart/form-data
- File uploads go through Vercel's serverless infrastructure
- There may be slight latency increase (one extra API call)
- Vercel has file size limits for serverless functions (check their docs)

