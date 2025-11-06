# Smash API Integration Setup

## Overview

Your landing page now uses **Smash API** instead of WeTransfer, allowing customers to upload photos directly from their browser/phone without leaving your site!

## Benefits of Smash over WeTransfer

✅ **Direct Upload**: Users upload photos directly on your site - no external redirects  
✅ **Better UX**: Smooth, integrated experience with progress indicators  
✅ **Mobile Friendly**: Works perfectly on phones with drag & drop support  
✅ **Large Files**: Supports files up to 5TB (much larger than WeTransfer's 2GB free limit)  
✅ **API Access**: Programmatic access to uploads via transfer URLs  

## Setup Instructions

### Step 1: Get Your Smash API Key

1. **Sign up for a free Smash account**:
   - Go to https://developer.fromsmash.com/signup
   - Create your developer account

2. **Get your API key**:
   - Log into your Smash developer dashboard
   - Navigate to "API Keys" section
   - Generate a new API key

3. **Choose your region**:
   - `eu-west-3` (Europe - default)
   - `us-east-1` (United States)

### Step 2: Add API Key to Vercel (Production)

**For production deployment on Vercel:**

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Key: `VITE_SMASH_API_KEY`
4. Value: Your Smash API key
5. Environments: Select **Production**, **Preview**, and **Development**
6. Click **"Save"**
7. **Redeploy** your site (go to Deployments → Redeploy)

**That's it!** The code already uses environment variables, so no code changes needed.

### Step 3: Test the Upload

1. Visit your live site (or run `npm run dev` locally)
2. Select an album size
3. Try uploading photos using the upload area
4. Check the browser console for any errors

**Note**: The Smash SDK is already integrated in the code. You just need to add your API key!

## How It Works

1. **User selects photos**: Click or drag & drop photos into the upload area
2. **Auto-upload**: Photos automatically upload to Smash when selected
3. **Progress tracking**: Real-time progress bar shows upload status
4. **Transfer URL**: Once complete, a Smash transfer URL is generated
5. **Order submission**: The transfer URL is included with the order data

## Security Considerations

⚠️ **Important**: The current implementation exposes your API key in the frontend JavaScript. This works for basic use cases, but for production, consider:

### Option 1: Backend Proxy (Recommended)
- Create a backend endpoint that generates temporary upload tokens
- Your frontend requests a token from your backend
- Frontend uses the token to upload (token expires after use)
- This keeps your API key secure

### Option 2: Backend Upload
- Users upload files to your backend
- Your backend uploads to Smash
- Completely hides API key from frontend

## What Gets Stored

When an order is submitted, the order data includes:
- `smashTransferUrl`: The URL to download the uploaded photos
- `fileCount`: Number of photos uploaded

You can use the `smashTransferUrl` to download the photos when processing the order.

## Troubleshooting

### "Please configure your Smash API key"
- Make sure you've added `VITE_SMASH_API_KEY` in Vercel environment variables
- Or if testing locally, check `src/components/UploadSection.jsx` has the key set
- After adding in Vercel, make sure to redeploy

### Upload fails
- Check browser console for error messages
- Verify your API key is correct
- Check your Smash account limits/quota
- Ensure you're using the correct region

### Files not uploading
- Check file types (only images are accepted)
- Verify file size isn't too large for your Smash plan
- Check internet connection

## Pricing

Smash offers a free tier and paid plans. Check their pricing at:
https://api.fromsmash.com/pricing

The free tier typically includes:
- Limited number of transfers per month
- File size limits
- Basic features

For production use, you may want to upgrade to a paid plan.

## Support

- Smash API Documentation: https://api.fromsmash.com/docs
- Smash Support: Check their website for support options

