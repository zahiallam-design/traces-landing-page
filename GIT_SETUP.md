# Git Authentication Setup Guide

## Problem
You're getting a 403 permission error because Windows is using cached credentials from a different GitHub account.

## Solution: Use New GitHub Account

### Step 1: Clear All Cached Credentials

Run these commands (already done for you):
```powershell
cmdkey /delete:git:https://github.com
git config --global credential.helper manager-core
```

### Step 2: Create New Repository (if needed)

If you want to create a NEW repository with your new GitHub account:

1. **Go to GitHub** and sign in with your NEW account
2. **Create new repository**: https://github.com/new
   - Name: `albums-landing-page` (or your choice)
   - Make it Public or Private
   - **Don't** initialize with README
3. **Copy the repository URL** (it will look like `https://github.com/YOUR_NEW_USERNAME/albums-landing-page.git`)

### Step 3: Update Remote URL

If you created a NEW repository, update the remote:

```powershell
git remote set-url origin https://github.com/YOUR_NEW_USERNAME/albums-landing-page.git
```

Replace `YOUR_NEW_USERNAME` with your actual GitHub username.

### Step 4: Push with New Credentials

When you push, Git will prompt for credentials:

```powershell
git push -u origin main
```

**When prompted:**
- **Username**: Your NEW GitHub username
- **Password**: Use a **Personal Access Token** (NOT your GitHub password)

### Step 5: Create Personal Access Token

If you don't have a token:

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name it: "Albums Landing Page"
4. Select scope: **`repo`** (check the box)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when Git prompts

---

## Alternative: Use SSH Instead of HTTPS

If you prefer SSH (no password prompts):

### Step 1: Generate SSH Key

```powershell
ssh-keygen -t ed25519 -C "your.email@example.com"
```

Press Enter to accept default location, then set a passphrase (optional).

### Step 2: Add SSH Key to GitHub

1. Copy your public key:
   ```powershell
   cat ~/.ssh/id_ed25519.pub
   ```
   (Or on Windows: `type C:\Users\zahi.allam\.ssh\id_ed25519.pub`)

2. Go to: https://github.com/settings/keys
3. Click **"New SSH key"**
4. Paste your public key
5. Click **"Add SSH key"**

### Step 3: Update Remote to Use SSH

```powershell
git remote set-url origin git@github.com:YOUR_NEW_USERNAME/albums-landing-page.git
```

### Step 4: Push

```powershell
git push -u origin main
```

No password prompt needed!

---

## Quick Fix: Just Update Remote and Push

If you already have the repository URL:

```powershell
# Update remote URL
git remote set-url origin https://github.com/YOUR_NEW_USERNAME/YOUR_REPO_NAME.git

# Push (will prompt for new credentials)
git push -u origin main
```

When prompted:
- Username: Your new GitHub username
- Password: Personal Access Token

---

## Verify Current Setup

Check your current remote:
```powershell
git remote -v
```

Check your Git config:
```powershell
git config --global user.name
git config --global user.email
```

Update Git config if needed:
```powershell
git config --global user.name "Your New Name"
git config --global user.email "your.new.email@example.com"
```

