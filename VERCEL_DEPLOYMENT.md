# Step-by-Step Vercel Deployment Guide

This guide will walk you through deploying your Albums Landing Page to Vercel, step by step.

## Prerequisites

- ✅ Your project code is ready
- ✅ Node.js installed (for local testing)
- ✅ GitHub account (free)

---

## Step 1: Prepare Your Project

### 1.1 Test Your Build Locally

Before deploying, make sure your project builds successfully:

```bash
# Install dependencies (if not already done)
npm install

# Test the production build
npm run build

# Preview the production build
npm run preview
```

**Expected result**: The build should complete without errors, and `npm run preview` should show your site at `http://localhost:4173`

**If you see errors**: Fix them before proceeding to deployment.

---

## Step 2: Create GitHub Repository

### 2.1 Create Account (if needed)

1. Go to [github.com](https://github.com)
2. Click "Sign up" if you don't have an account
3. Complete the signup process

### 2.2 Create New Repository

1. Click the **"+"** icon in the top right → **"New repository"**
2. Repository name: `albums-landing-page` (or your preferred name)
3. Description (optional): "Photo album service landing page"
4. Choose **Public** (free) or **Private** (if you have GitHub Pro)
5. **DO NOT** check "Initialize with README" (you already have files)
6. Click **"Create repository"**

### 2.3 Copy Repository URL

After creating, GitHub will show you a URL like:
```
https://github.com/YOUR_USERNAME/albums-landing-page.git
```
**Copy this URL** - you'll need it in the next step.

---

## Step 3: Push Code to GitHub

### 3.1 Open Terminal/Command Prompt

Navigate to your project folder:
```bash
cd "c:\Users\zahi.allam\WorkProjects\Albums Landing Page"
```

### 3.2 Initialize Git (if not already done)

```bash
git init
```

### 3.3 Add All Files

```bash
git add .
```

### 3.4 Create First Commit

```bash
git commit -m "Initial commit - Albums landing page"
```

### 3.5 Connect to GitHub

Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/albums-landing-page.git
```

### 3.6 Push to GitHub

```bash
git branch -M main
git push -u origin main
```

**You'll be prompted for GitHub credentials:**
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your GitHub password)
  - Get one at: [github.com/settings/tokens](https://github.com/settings/tokens)
  - Click "Generate new token (classic)"
  - Select scope: `repo`
  - Generate and copy the token
  - Use this token as your password

**Expected result**: You should see "Writing objects" and your files uploading to GitHub.

### 3.7 Verify Upload

1. Go back to your GitHub repository page
2. Refresh the page
3. You should see all your project files listed

---

## Step 4: Deploy to Vercel

### 4.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Click **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. Complete the signup process

### 4.2 Import Your Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. You'll see a list of your GitHub repositories
3. Find **"albums-landing-page"** (or your repo name)
4. Click **"Import"** next to it

### 4.3 Configure Project Settings

Vercel will auto-detect your project settings. Verify:

- **Framework Preset**: `Vite` ✅ (should be auto-detected)
- **Root Directory**: `./` ✅ (should be auto-detected)
- **Build Command**: `npm run build` ✅ (should be auto-detected)
- **Output Directory**: `dist` ✅ (should be auto-detected)
- **Install Command**: `npm install` ✅ (should be auto-detected)

**You don't need to change anything** - Vercel detects Vite projects automatically!

### 4.4 Add Environment Variables (Optional - Do Later)

**Skip this for now** - you'll configure API keys after deployment.

We'll add these later in Step 6.

### 4.5 Deploy

1. Click the **"Deploy"** button
2. Wait 1-2 minutes while Vercel:
   - Installs dependencies
   - Builds your project
   - Deploys to their CDN

### 4.6 Success!

You'll see:
- ✅ "Building..."
- ✅ "Deploying..."
- ✅ "Ready" with a green checkmark

**Your site is now live!** 🎉

---

## Step 5: Get Your Live URL

### 5.1 View Your Deployment

After deployment completes:

1. You'll see a success message
2. Click **"Visit"** or copy the URL shown
3. Your URL will be: `albums-landing-page-xxxxx.vercel.app`

### 5.2 Test Your Site

1. Open the URL in your browser
2. Test the site:
   - ✅ Page loads correctly
   - ✅ Navigation works
   - ✅ All sections display
   - ✅ Mobile view works

**Note**: API features (upload, email) won't work yet - we'll configure those next.

---

## Step 6: Configure Environment Variables (After Deployment)

### 6.1 Access Project Settings

1. In Vercel dashboard, click on your project
2. Go to **"Settings"** tab
3. Click **"Environment Variables"** in the left sidebar

### 6.2 Add Smash API Key

1. Click **"Add New"**
2. Key: `VITE_SMASH_API_KEY`
3. Value: Your actual Smash API key
4. Environments: Select **Production**, **Preview**, and **Development**
5. Click **"Save"**

### 6.3 Add EmailJS Variables

Repeat for each EmailJS variable:

**Variable 1:**
- Key: `VITE_EMAILJS_SERVICE_ID`
- Value: Your EmailJS Service ID
- Environments: All

**Variable 2:**
- Key: `VITE_EMAILJS_TEMPLATE_ID`
- Value: Your EmailJS Template ID
- Environments: All

**Variable 3:**
- Key: `VITE_EMAILJS_PUBLIC_KEY`
- Value: Your EmailJS Public Key
- Environments: All

### 6.4 Add WhatsApp Number

- Key: `VITE_WHATSAPP_NUMBER`
- Value: Your WhatsApp number (format: country code + number, no + or spaces)
- Example: `1234567890`
- Environments: All

### 6.5 Redeploy

After adding environment variables:

1. Go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for redeployment to complete

**Now your API integrations will work!**

---

## Step 7: Test Everything

### 7.1 Test Checklist

Visit your live site and test:

- [ ] **Page loads** - No errors in console
- [ ] **Navigation** - Smooth scrolling works
- [ ] **Album selection** - Can select size and color
- [ ] **Photo upload** - Upload works with Smash API
- [ ] **Order form** - Form submits successfully
- [ ] **Email** - You receive order email
- [ ] **WhatsApp** - Links open WhatsApp correctly
- [ ] **Mobile view** - Looks good on phone
- [ ] **Tablet view** - Looks good on tablet

### 7.2 Common Issues

**Photos don't upload?**
- Check Smash API key is set correctly in Vercel environment variables
- Verify Smash account is active

**Emails don't send?**
- Check EmailJS variables are set correctly
- Verify EmailJS template is configured
- Check EmailJS dashboard for errors

**WhatsApp links don't work?**
- Verify WhatsApp number format (no +, no spaces)
- Format: `1234567890` (country code + number)

---

## Step 8: Custom Domain (Optional)

### 8.1 Add Custom Domain

1. In Vercel project → **"Settings"** → **"Domains"**
2. Enter your domain: `youralbums.com`
3. Click **"Add"**

### 8.2 Configure DNS

Vercel will show you DNS records to add:

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add the DNS records Vercel provides
3. Wait for DNS propagation (5 minutes to 48 hours)
4. Vercel will automatically configure HTTPS

---

## Step 9: Automatic Deployments

### 9.1 How It Works

Every time you push code to GitHub:
- Vercel automatically detects the change
- Builds your project
- Deploys the new version
- Your site updates automatically!

### 9.2 Making Updates

To update your site:

```bash
# Make your changes
# Then commit and push:
git add .
git commit -m "Your update description"
git push
```

Vercel will automatically deploy the update!

---

## Troubleshooting

### Build Fails

**Error**: "Build failed"
- Check the build logs in Vercel
- Common issues:
  - Missing dependencies in `package.json`
  - Syntax errors in code
  - Environment variables not set

**Solution**: Fix the error locally first (`npm run build`), then push again.

### Site Shows 404

**Error**: Page not found on refresh
- Vercel handles this automatically for SPAs
- If it happens, check Vercel project settings
- Ensure "Framework Preset" is set to "Vite"

### Environment Variables Not Working

**Error**: API keys not working
- Make sure variable names start with `VITE_`
- Redeploy after adding variables
- Check variable values are correct (no extra spaces)

---

## Next Steps

After deployment:

1. ✅ **Configure EmailJS** - Follow `EMAILJS_SETUP.md`
2. ✅ **Configure Smash API** - Follow `SMASH_SETUP.md`
3. ✅ **Update WhatsApp numbers** - In Vercel environment variables
4. ✅ **Test everything** - Make sure all features work
5. ✅ **Share your URL** - Start getting orders!

---

## Quick Reference

**Your Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)

**Your GitHub Repository**: `https://github.com/YOUR_USERNAME/albums-landing-page`

**Your Live Site**: `albums-landing-page-xxxxx.vercel.app`

**Need Help?**
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Support: Check their website

---

## Summary Checklist

- [ ] Project builds locally (`npm run build`)
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Initial deployment successful
- [ ] Environment variables added
- [ ] Site redeployed with variables
- [ ] All features tested and working
- [ ] Custom domain added (optional)

**Congratulations! Your landing page is now live! 🎉**

