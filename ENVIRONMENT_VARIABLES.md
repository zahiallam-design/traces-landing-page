# Environment Variables Reference

Complete list of all environment variables used in the project.

## 🔒 Security Update

**Smash API and EmailJS are secured using Vercel Serverless Functions.**

- ✅ API keys stay on the server (never exposed to browser)
- ✅ Use variables **WITHOUT** `VITE_` prefix for serverless functions
- ✅ Only `VITE_WHATSAPP_NUMBER` needs `VITE_` prefix (frontend use)
- ✅ Optional: enable direct Smash uploads from the browser to avoid batch splitting

---

## Complete List

### Server-Side Variables (Serverless Functions) - NO `VITE_` prefix

#### 1. Smash API
- **Key**: `SMASH_API_KEY` ⚠️ (NOT `VITE_SMASH_API_KEY`)
- **Value**: Your Smash API key
- **Required**: Yes
- **Environments**: Production, Preview, Development
- **Used in**: `api/upload.js` (serverless function)

- **Key**: `SMASH_REGION` (Optional)
- **Value**: `eu-west-3` or `us-east-1`
- **Default**: `eu-west-3` (if not set)
- **Required**: No
- **Environments**: Production, Preview, Development

#### 2. EmailJS - Business Owner Email
- **Key**: `EMAILJS_SERVICE_ID` ⚠️ (NOT `VITE_EMAILJS_SERVICE_ID`)
- **Value**: Your EmailJS Service ID
- **Required**: Yes
- **Environments**: Production, Preview, Development
- **Used in**: `api/send-email.js` (serverless function)

- **Key**: `EMAILJS_TEMPLATE_ID` ⚠️ (NOT `VITE_EMAILJS_TEMPLATE_ID`)
- **Value**: Your EmailJS Template ID (Business Owner template)
- **Required**: Yes
- **Environments**: Production, Preview, Development

- **Key**: `EMAILJS_PUBLIC_KEY` ⚠️ (NOT `VITE_EMAILJS_PUBLIC_KEY`)
- **Value**: Your EmailJS Public Key
- **Required**: Yes
- **Environments**: Production, Preview, Development

- **Key**: `EMAILJS_PRIVATE_KEY` ⚠️ (NOT `VITE_EMAILJS_PRIVATE_KEY`)
- **Value**: Your EmailJS Private Key (Access Token)
- **Required**: Yes (for server-side API calls)
- **How to get**: EmailJS Dashboard → Account → Security → Copy Private Key
- **Environments**: Production, Preview, Development
- **Used in**: `api/send-email.js` (serverless function)

#### 3. EmailJS - Customer Confirmation Email
- **Key**: `EMAILJS_CUSTOMER_TEMPLATE_ID` ⚠️ (NOT `VITE_EMAILJS_CUSTOMER_TEMPLATE_ID`)
- **Value**: Your EmailJS Customer Template ID (Customer confirmation template)
- **Required**: Yes (for customer emails to work)
- **Environments**: Production, Preview, Development


### Frontend Variables (Browser) - WITH `VITE_` prefix

#### 4. WhatsApp
- **Key**: `VITE_WHATSAPP_NUMBER`
- **Value**: Your WhatsApp number (format: country code + number, no + or spaces)
- **Example**: `1234567890`
- **Required**: Yes
- **Environments**: Production, Preview, Development
- **Used in**: Frontend components (Footer, WhatsAppButton)

#### 5. Smash Direct Upload (Optional)
- **Key**: `VITE_SMASH_API_KEY`
- **Value**: Your Smash API key (browser use)
- **Required**: No (only if you want direct browser uploads)
- **Environments**: Production, Preview, Development
- **Used in**: `src/components/UploadSection.jsx` (direct Smash upload)

- **Key**: `VITE_SMASH_REGION` (Optional)
- **Value**: `eu-west-3` or `us-east-1`
- **Default**: `eu-west-3`
- **Required**: No
- **Environments**: Production, Preview, Development

---

## Summary Table

### Server-Side Variables (Secure - No `VITE_` prefix)

| Variable Name | Purpose | Required | Default | Location |
|--------------|---------|----------|---------|----------|
| `SMASH_API_KEY` | Smash API key for photo uploads | ✅ Yes | None | Serverless function |
| `SMASH_REGION` | Smash API region | ❌ No | `eu-west-3` | Serverless function |
| `EMAILJS_SERVICE_ID` | EmailJS service ID | ✅ Yes | None | Serverless function |
| `EMAILJS_TEMPLATE_ID` | Business owner email template | ✅ Yes | None | Serverless function |
| `EMAILJS_CUSTOMER_TEMPLATE_ID` | Customer confirmation template | ✅ Yes | None | Serverless function |
| `EMAILJS_PUBLIC_KEY` | EmailJS public key | ✅ Yes | None | Serverless function |
| `EMAILJS_PRIVATE_KEY` | EmailJS private key (access token) | ✅ Yes | None | Serverless function |

### Frontend Variables (Browser - WITH `VITE_` prefix)

| Variable Name | Purpose | Required | Default | Location |
|--------------|---------|----------|---------|----------|
| `VITE_WHATSAPP_NUMBER` | WhatsApp contact number | ✅ Yes | None | Frontend components |
| `VITE_SMASH_API_KEY` | Smash API key for direct upload | ❌ No | None | Frontend (optional) |
| `VITE_SMASH_REGION` | Smash API region for direct upload | ❌ No | `eu-west-3` | Frontend (optional) |

**Total**: 10 environment variables (7 server-side, 3 frontend)

---

## Where They're Used in Code

### Server-Side (Secure):
- `SMASH_API_KEY` → `api/upload.js` (serverless function)
- `SMASH_REGION` → `api/upload.js` (serverless function)
- `EMAILJS_SERVICE_ID` → `api/send-email.js` (serverless function)
- `EMAILJS_TEMPLATE_ID` → `api/send-email.js` (serverless function)
- `EMAILJS_CUSTOMER_TEMPLATE_ID` → `api/send-email.js` (serverless function)
- `EMAILJS_PUBLIC_KEY` → `api/send-email.js` (serverless function)
- `EMAILJS_PRIVATE_KEY` → `api/send-email.js` (serverless function)

### Frontend (Browser):
- `VITE_WHATSAPP_NUMBER` → `src/components/Footer.jsx` & `src/components/WhatsAppButton.jsx`
- `VITE_SMASH_API_KEY` → `src/components/UploadSection.jsx` (direct upload, optional)
- `VITE_SMASH_REGION` → `src/components/UploadSection.jsx` (direct upload, optional)

---

## Quick Setup Checklist

### Server-Side Variables (NO `VITE_` prefix):
- [ ] `SMASH_API_KEY` - Get from Smash dashboard
- [ ] `SMASH_REGION` - Set to `eu-west-3` or `us-east-1` (optional)
- [ ] `EMAILJS_SERVICE_ID` - Get from EmailJS dashboard
- [ ] `EMAILJS_TEMPLATE_ID` - Get from EmailJS templates (Business Owner)
- [ ] `EMAILJS_CUSTOMER_TEMPLATE_ID` - Get from EmailJS templates (Customer)
- [ ] `EMAILJS_PUBLIC_KEY` - Get from EmailJS account settings
- [ ] `EMAILJS_PRIVATE_KEY` - Get from EmailJS Dashboard → Account → Security

### Frontend Variables (WITH `VITE_` prefix):
- [ ] `VITE_WHATSAPP_NUMBER` - Your WhatsApp number (no +, no spaces)
- [ ] `VITE_SMASH_API_KEY` - Smash API key (optional, enables direct upload)
- [ ] `VITE_SMASH_REGION` - Smash region (optional)

---

## Notes

### Security Update:
- ✅ **Server-side variables** (Smash, EmailJS) use NO `VITE_` prefix - they stay secure on the server
- ✅ **Frontend variables** (WhatsApp) use `VITE_` prefix - only safe for public use
- ⚠️ **Direct Smash upload** uses `VITE_SMASH_API_KEY` in the browser (public exposure). Only enable if acceptable.
- ✅ After adding variables in Vercel, **redeploy** your site for changes to take effect
- ✅ Server-side variables are **NEVER exposed** to the browser (secure!)

### Setup Guides:
- `SECURE_SETUP_STEPS.md` - Step-by-step setup instructions
- `SECURE_API_SETUP.md` - Detailed architecture and security info
- `SMASH_SETUP.md` - Smash API setup (updated for serverless)
- `EMAILJS_SETUP.md` - EmailJS setup (updated for serverless)

