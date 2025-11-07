# Secure API Setup Guide - Serverless Functions

This guide explains how both **Smash API** and **EmailJS** are now secured using Vercel Serverless Functions.

## 🔒 Security Improvement

### Before (Insecure)
- ❌ Smash API key exposed in frontend JavaScript
- ❌ EmailJS credentials exposed in frontend JavaScript
- ❌ Anyone could view API keys in browser DevTools
- ❌ Keys visible in the bundled code

### Now (Secure)
- ✅ Smash API key stays on server (never exposed)
- ✅ EmailJS credentials stay on server (never exposed)
- ✅ Frontend calls secure API endpoints
- ✅ API keys never sent to browser

## 📁 Architecture

```
Frontend (Browser)
    ↓
/api/upload          (Smash uploads)
/api/send-email      (EmailJS emails)
    ↓
Vercel Serverless Functions
    ↓ (uses secure env vars)
Smash API / EmailJS API
    ↓ (returns results)
Serverless Functions
    ↓ (returns to frontend)
Frontend (Browser)
```

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

This installs `busboy` for parsing file uploads in the serverless function.

### Step 2: Update Vercel Environment Variables

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

#### Add/Update These Variables:

**For Serverless Functions (Server-side only - NO `VITE_` prefix):**

1. **Smash API:**
   - Key: `SMASH_API_KEY`
     - Value: Your Smash API key
     - Environments: ✅ Production, ✅ Preview, ✅ Development
   
   - Key: `SMASH_REGION` (Optional)
     - Value: `eu-west-3` or `us-east-1`
     - Default: `eu-west-3`
     - Environments: ✅ Production, ✅ Preview, ✅ Development

2. **EmailJS:**
   - Key: `EMAILJS_SERVICE_ID`
     - Value: Your EmailJS Service ID
     - Environments: ✅ Production, ✅ Preview, ✅ Development
   
   - Key: `EMAILJS_TEMPLATE_ID`
     - Value: Your Business Owner Template ID
     - Environments: ✅ Production, ✅ Preview, ✅ Development
   
   - Key: `EMAILJS_CUSTOMER_TEMPLATE_ID`
     - Value: Your Customer Template ID
     - Environments: ✅ Production, ✅ Preview, ✅ Development
   
   - Key: `EMAILJS_PUBLIC_KEY`
     - Value: Your EmailJS Public Key
     - Environments: ✅ Production, ✅ Preview, ✅ Development

#### Remove Old Frontend Variables (Optional but Recommended):

You can now **remove** these from Vercel (they're no longer needed):
- ❌ `VITE_SMASH_API_KEY` (removed - now using `SMASH_API_KEY`)
- ❌ `VITE_EMAILJS_SERVICE_ID` (removed - now using `EMAILJS_SERVICE_ID`)
- ❌ `VITE_EMAILJS_TEMPLATE_ID` (removed - now using `EMAILJS_TEMPLATE_ID`)
- ❌ `VITE_EMAILJS_CUSTOMER_TEMPLATE_ID` (removed - now using `EMAILJS_CUSTOMER_TEMPLATE_ID`)
- ❌ `VITE_EMAILJS_PUBLIC_KEY` (removed - now using `EMAILJS_PUBLIC_KEY`)

**Keep:**
- ✅ `VITE_WHATSAPP_NUMBER` (still needed for frontend)

### Step 3: Deploy to Vercel

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Secure APIs with serverless functions"
   git push origin main
   ```

2. **Vercel will auto-deploy** (takes 1-2 minutes)

3. **Verify deployment:**
   - Check Vercel dashboard for successful deployment
   - Check function logs if there are errors

### Step 4: Test Everything

1. **Test File Upload:**
   - Select photos
   - Upload should work (calls `/api/upload`)
   - Check browser console - no API keys visible
   - Check Vercel function logs for upload activity

2. **Test Email Sending:**
   - Submit an order
   - You should receive business owner email
   - Customer should receive confirmation email
   - Check browser console - no EmailJS keys visible

3. **Verify Security:**
   - Open browser DevTools → Sources/Network
   - Search for API keys - they should NOT appear
   - Only `/api/upload` and `/api/send-email` calls visible

## 📂 File Structure

```
project-root/
├── api/
│   ├── upload.js          # Smash upload serverless function
│   └── send-email.js      # EmailJS serverless function
├── src/
│   ├── components/
│   │   └── UploadSection.jsx  # Calls /api/upload
│   └── services/
│       └── emailService.js    # Calls /api/send-email
└── package.json          # Includes busboy dependency
```

## 🔍 How It Works

### File Upload Flow:
1. User selects files → `UploadSection.jsx`
2. Frontend sends files → `/api/upload` (FormData)
3. Serverless function:
   - Parses files using busboy
   - Creates Smash transfer using `SMASH_API_KEY`
   - Uploads files to Smash
   - Returns transfer URL
4. Frontend receives transfer URL → continues with order

### Email Sending Flow:
1. User submits order → `App.jsx`
2. Frontend calls → `/api/send-email` (JSON)
3. Serverless function:
   - Formats email data
   - Sends via EmailJS API using server-side credentials
   - Returns success/error
4. Frontend shows success message

## 🛠️ Troubleshooting

### "Smash API key not configured"
- ✅ Check `SMASH_API_KEY` is set in Vercel (not `VITE_SMASH_API_KEY`)
- ✅ Make sure you redeployed after adding variable
- ✅ Check serverless function logs in Vercel dashboard

### "EmailJS credentials not configured"
- ✅ Check all EmailJS variables are set (without `VITE_` prefix)
- ✅ Verify variable names match exactly
- ✅ Redeploy after adding variables

### Upload fails
- ✅ Check Vercel function logs
- ✅ Verify busboy is installed (`npm install`)
- ✅ Check file size limits (Vercel has limits)
- ✅ Verify Smash API key is correct

### Emails not sending
- ✅ Check Vercel function logs
- ✅ Verify EmailJS credentials are correct
- ✅ Check EmailJS dashboard for errors
- ✅ Verify templates are configured correctly

### Functions timeout
- ✅ Check Vercel function timeout settings
- ✅ Large files may take longer - consider chunking
- ✅ Check Vercel plan limits

## ✅ Security Checklist

- [ ] `SMASH_API_KEY` set in Vercel (without `VITE_` prefix)
- [ ] `EMAILJS_SERVICE_ID` set in Vercel (without `VITE_` prefix)
- [ ] `EMAILJS_TEMPLATE_ID` set in Vercel
- [ ] `EMAILJS_CUSTOMER_TEMPLATE_ID` set in Vercel
- [ ] `EMAILJS_PUBLIC_KEY` set in Vercel
- [ ] Old `VITE_*` variables removed (optional)
- [ ] Code deployed to Vercel
- [ ] Upload functionality tested
- [ ] Email functionality tested
- [ ] Verified API keys NOT visible in browser DevTools

## 📊 Benefits

✅ **Complete Security** - API keys never exposed  
✅ **Server-side Validation** - Can add rate limiting  
✅ **Better Error Handling** - Centralized error management  
✅ **Logging** - Track all API calls server-side  
✅ **Future-proof** - Easy to add authentication/authorization  
✅ **Compliance** - Better for security audits

## 📝 Notes

- Serverless functions use `busboy` for multipart/form-data parsing
- File uploads go through Vercel's serverless infrastructure
- There may be slight latency increase (one extra API call per operation)
- Vercel has file size limits for serverless functions (check their docs)
- EmailJS Public Key is still "public" by design, but now it's server-side only

## 🎯 Summary

Both APIs are now **completely secure**:
- ✅ Smash API key: Hidden on server
- ✅ EmailJS credentials: Hidden on server
- ✅ Frontend: Only makes API calls, no credentials
- ✅ Browser: Cannot access API keys

Your landing page is now production-ready with enterprise-level security! 🎉

