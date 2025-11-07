# 🔒 Secure API Setup - Step-by-Step Guide

Complete guide to secure both Smash API and EmailJS using Vercel Serverless Functions.

---

## ✅ What's Already Done

The code changes are complete:
- ✅ Serverless function for Smash uploads (`api/upload.js`)
- ✅ Serverless function for EmailJS (`api/send-email.js`)
- ✅ Frontend updated to use serverless functions
- ✅ EmailJS browser SDK removed from dependencies

---

## 📋 Step-by-Step Setup Instructions

### Step 1: Install Dependencies

Open terminal in your project folder and run:

```bash
npm install
```

This installs `busboy` needed for file upload parsing in serverless functions.

**Expected output:** Dependencies installed successfully

---

### Step 2: Update Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your project

2. **Navigate to Settings:**
   - Click **"Settings"** tab
   - Click **"Environment Variables"** in left sidebar

3. **Add/Update Server-Side Variables** (NO `VITE_` prefix):

   **Smash API:**
   - Click **"Add New"**
   - Key: `SMASH_API_KEY` ⚠️ (NOT `VITE_SMASH_API_KEY`)
   - Value: Your Smash API key
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

   - Click **"Add New"** (optional)
   - Key: `SMASH_REGION`
   - Value: `eu-west-3` (or `us-east-1`)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

   **EmailJS:**
   - Click **"Add New"**
   - Key: `EMAILJS_SERVICE_ID` ⚠️ (NOT `VITE_EMAILJS_SERVICE_ID`)
   - Value: Your EmailJS Service ID
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

   - Click **"Add New"**
   - Key: `EMAILJS_TEMPLATE_ID` ⚠️ (NOT `VITE_EMAILJS_TEMPLATE_ID`)
   - Value: Your Business Owner Template ID
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

   - Click **"Add New"**
   - Key: `EMAILJS_CUSTOMER_TEMPLATE_ID` ⚠️ (NOT `VITE_EMAILJS_CUSTOMER_TEMPLATE_ID`)
   - Value: Your Customer Template ID
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

   - Click **"Add New"**
   - Key: `EMAILJS_PUBLIC_KEY` ⚠️ (NOT `VITE_EMAILJS_PUBLIC_KEY`)
   - Value: Your EmailJS Public Key
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

4. **Remove Old Frontend Variables** (Optional but Recommended):

   You can now **delete** these old variables (they're no longer needed):
   - ❌ `VITE_SMASH_API_KEY` → Delete
   - ❌ `VITE_EMAILJS_SERVICE_ID` → Delete
   - ❌ `VITE_EMAILJS_TEMPLATE_ID` → Delete
   - ❌ `VITE_EMAILJS_CUSTOMER_TEMPLATE_ID` → Delete
   - ❌ `VITE_EMAILJS_PUBLIC_KEY` → Delete

   **Keep:**
   - ✅ `VITE_WHATSAPP_NUMBER` (still needed for frontend)

---

### Step 3: Commit and Push Changes

1. **Open terminal** in your project folder

2. **Check what changed:**
   ```bash
   git status
   ```

3. **Add all changes:**
   ```bash
   git add .
   ```

4. **Commit:**
   ```bash
   git commit -m "Secure APIs: Move Smash and EmailJS to serverless functions"
   ```

5. **Push to GitHub:**
   ```bash
   git push origin main
   ```

---

### Step 4: Wait for Vercel Deployment

1. **Vercel will automatically detect** the push and start deploying
2. **Wait 1-2 minutes** for deployment to complete
3. **Check Vercel dashboard** for deployment status:
   - Should show ✅ "Ready" with green checkmark
   - If errors, check the build logs

---

### Step 5: Test Everything

#### Test 1: File Upload
1. Visit your live site
2. Select an album size
3. Upload some photos
4. **Expected:** Upload should work, progress bar shows
5. **Verify:** Open browser DevTools → Network tab
   - Should see call to `/api/upload`
   - Should NOT see Smash API key anywhere

#### Test 2: Email Sending
1. Fill out the order form (including email)
2. Submit the order
3. **Expected:** 
   - You receive business owner email ✅
   - Customer receives confirmation email ✅
4. **Verify:** Open browser DevTools → Network tab
   - Should see calls to `/api/send-email`
   - Should NOT see EmailJS credentials anywhere

#### Test 3: Security Verification
1. Open browser DevTools (F12)
2. Go to **Sources** or **Network** tab
3. Search for your API keys:
   - Search for "SMASH_API_KEY" → Should find NOTHING ✅
   - Search for "EMAILJS" → Should find NOTHING ✅
   - Search for your actual API key values → Should find NOTHING ✅

---

## 🔍 Troubleshooting

### Issue: "Smash API key not configured"
**Solution:**
- Check `SMASH_API_KEY` is set (not `VITE_SMASH_API_KEY`)
- Make sure you redeployed after adding variable
- Check Vercel function logs: **Deployments** → Click latest → **Functions** tab

### Issue: "EmailJS credentials not configured"
**Solution:**
- Check all EmailJS variables are set (without `VITE_` prefix)
- Verify variable names match exactly
- Redeploy after adding variables

### Issue: Upload fails
**Solution:**
- Check Vercel function logs
- Verify `busboy` is installed (`npm install`)
- Check file size limits
- Verify Smash API key is correct

### Issue: Emails not sending
**Solution:**
- Check Vercel function logs
- Verify EmailJS credentials are correct
- Check EmailJS dashboard for errors
- Verify templates are configured

---

## ✅ Final Checklist

- [ ] `npm install` completed successfully
- [ ] `SMASH_API_KEY` added in Vercel (without `VITE_` prefix)
- [ ] `EMAILJS_SERVICE_ID` added in Vercel (without `VITE_` prefix)
- [ ] `EMAILJS_TEMPLATE_ID` added in Vercel
- [ ] `EMAILJS_CUSTOMER_TEMPLATE_ID` added in Vercel
- [ ] `EMAILJS_PUBLIC_KEY` added in Vercel
- [ ] Old `VITE_*` variables removed (optional)
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] File upload tested and working
- [ ] Email sending tested and working
- [ ] Verified API keys NOT visible in browser

---

## 🎉 Success!

Once all steps are complete:
- ✅ Smash API key is secure (server-side only)
- ✅ EmailJS credentials are secure (server-side only)
- ✅ No API keys exposed in browser
- ✅ Production-ready security

Your landing page now has **enterprise-level security**! 🔒

---

## 📚 Additional Resources

- **Full Documentation:** See `SECURE_API_SETUP.md` for detailed architecture
- **Smash Setup:** See `SMASH_SETUP.md` (updated for serverless)
- **EmailJS Setup:** See `EMAILJS_SETUP.md` (updated for serverless)
- **Vercel Functions:** https://vercel.com/docs/functions

---

## Need Help?

If something doesn't work:
1. Check Vercel function logs (Deployments → Functions)
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Make sure you redeployed after adding variables

