# Deployment Guide - Getting Your Landing Page Online

This guide will help you deploy your React landing page so customers can use it online.

## Pre-Deployment Checklist

Before deploying, make sure you've completed:

- ✅ **Smash API**: Configured in `src/components/UploadSection.jsx`
- ✅ **EmailJS**: Configured in `src/services/emailService.js`
- ✅ **WhatsApp**: Updated numbers in `Footer.jsx` and `WhatsAppButton.jsx`
- ✅ **Logo**: Added `public/logo.png` (optional)
- ✅ **Testing**: Tested locally with `npm run dev`

## Deployment Options

### Option 1: Vercel (Recommended - Easiest) ⭐

**Best for**: Quick deployment, automatic HTTPS, great performance

**Steps**:

1. **Create a GitHub account** (if you don't have one):
   - Go to [github.com](https://github.com) and sign up
   - It's free and required for Vercel

2. **Push your code to GitHub**:
   ```bash
   # Initialize git (if not already done)
   git init
   
   # Add all files
   git add .
   
   # Commit
   git commit -m "Initial commit - Albums landing page"
   
   # Create a new repository on GitHub (go to github.com/new)
   # Then connect and push:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account (free)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite React app
   - Click "Deploy" (no configuration needed!)
   - Wait 1-2 minutes for deployment
   - **Done!** You'll get a URL like `your-albums.vercel.app`

4. **Get your live URL**:
   - Vercel will give you a URL automatically
   - You can customize it in project settings
   - Example: `albums-landing.vercel.app`

**Pros**:
- ✅ Free forever for personal projects
- ✅ Automatic HTTPS (secure)
- ✅ Auto-deploys on every GitHub push
- ✅ Fast global CDN
- ✅ Zero configuration needed

---

### Option 2: Netlify

**Best for**: Similar to Vercel, great alternative

**Steps**:

1. **Push code to GitHub** (same as Vercel step 2)

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub (free)
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository
   - Build settings (auto-detected):
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"
   - Wait 2-3 minutes
   - **Done!** URL like `your-albums.netlify.app`

**Pros**:
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Auto-deploys on push
- ✅ Easy to use

---

### Option 3: GitHub Pages

**Best for**: Free hosting if you want everything on GitHub

**Steps**:

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**:
   Add these scripts:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview",
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Update vite.config.js**:
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/YOUR_REPO_NAME/' // Replace with your GitHub repo name
   })
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**:
   - Go to your GitHub repo → Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` → `/ (root)`
   - Save
   - Your site will be at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

**Pros**:
- ✅ Completely free
- ✅ Integrated with GitHub

**Cons**:
- ⚠️ Requires repository to be public (or paid GitHub)
- ⚠️ URL includes `/repo-name/` path

---

### Option 4: Your Own Server/Hosting

**Best for**: If you have existing hosting

**Steps**:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload dist folder**:
   - Upload everything in the `dist` folder to your web server
   - Make sure your server supports single-page apps (SPA)
   - Configure server to serve `index.html` for all routes

**Hosting providers that work**:
- DigitalOcean
- AWS S3 + CloudFront
- Google Cloud Storage
- Any VPS with Nginx/Apache

---

## Recommended: Vercel Deployment (Step-by-Step)

**📘 For detailed step-by-step instructions, see `VERCEL_DEPLOYMENT.md`**

This section provides a quick overview. For complete instructions with screenshots and troubleshooting, refer to the dedicated guide.

Here's the easiest path:

### Step 1: Install Git (if needed)

Download from [git-scm.com](https://git-scm.com/downloads)

### Step 2: Initialize Git Repository

Open terminal in your project folder:

```bash
cd "c:\Users\zahi.allam\WorkProjects\Albums Landing Page"
git init
git add .
git commit -m "Initial commit"
```

### Step 3: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it: `albums-landing-page` (or your choice)
3. Don't initialize with README (you already have one)
4. Click "Create repository"

### Step 4: Push to GitHub

Copy the commands GitHub shows you, or use:

```bash
git remote add origin https://github.com/YOUR_USERNAME/albums-landing-page.git
git branch -M main
git push -u origin main
```

### Step 5: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel
4. Click "Add New Project"
5. Find your repository → Click "Import"
6. Click "Deploy" (all settings auto-detected)
7. Wait 1-2 minutes
8. **Done!** Copy your URL

### Step 6: Share Your Landing Page

Your URL will be something like:
- `albums-landing-page.vercel.app`
- Or you can add a custom domain later

---

## Post-Deployment Checklist

After deploying, verify:

- [ ] Site loads correctly
- [ ] All images/logo display
- [ ] Smash upload works (test with a photo)
- [ ] Order form submits successfully
- [ ] You receive test order email
- [ ] WhatsApp links work
- [ ] Mobile view looks good
- [ ] All sections scroll smoothly

---

## Custom Domain (Optional)

Want a custom domain like `youralbums.com`?

### On Vercel:
1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS setup instructions
4. Done! (HTTPS auto-configured)

### On Netlify:
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS
4. Done!

---

## Environment Variables (Production)

For production, consider using environment variables instead of hardcoding API keys:

1. **Create `.env` file** (add to `.gitignore`):
   ```
   VITE_SMASH_API_KEY=your_key_here
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```

2. **Update code to use**:
   ```javascript
   const SMASH_API_KEY = import.meta.env.VITE_SMASH_API_KEY;
   ```

3. **Add to Vercel/Netlify**:
   - Project Settings → Environment Variables
   - Add each variable
   - Redeploy

---

## Troubleshooting

### Build fails?
- Check console for errors
- Make sure all dependencies are in `package.json`
- Run `npm install` locally first

### Site works but emails don't send?
- Verify EmailJS credentials are correct
- Check EmailJS dashboard for usage limits
- Test email template in EmailJS dashboard

### Photos don't upload?
- Verify Smash API key is correct
- Check Smash account quota/limits
- Test in browser console for errors

### 404 errors on refresh?
- Make sure your hosting supports SPA (Single Page Apps)
- Vercel/Netlify handle this automatically
- For other hosts, configure redirect rules

---

## Need Help?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **GitHub Pages Docs**: [pages.github.com](https://pages.github.com)

---

## Quick Deploy Command Reference

```bash
# Build locally to test
npm run build
npm run preview

# Deploy to Vercel (after connecting GitHub)
# Just push to GitHub, Vercel auto-deploys!

# Deploy to Netlify (after connecting GitHub)
# Just push to GitHub, Netlify auto-deploys!

# Deploy to GitHub Pages
npm run deploy
```

