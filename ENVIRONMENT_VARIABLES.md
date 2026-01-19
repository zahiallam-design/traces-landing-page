# Environment Variables Reference

Complete list of all environment variables used in the project.

## 🔒 Security Update

**Dropbox and EmailJS are secured using Vercel Serverless Functions.**

- ✅ API keys stay on the server (never exposed to browser)
- ✅ Use variables **WITHOUT** `VITE_` prefix for serverless functions
- ✅ Only `VITE_WHATSAPP_NUMBER` needs `VITE_` prefix (frontend use)

---

## Complete List

### Server-Side Variables (Serverless Functions) - NO `VITE_` prefix

#### 1. Dropbox OAuth (Recommended - refresh tokens)
- **Key**: `DROPBOX_APP_KEY`
- **Value**: Dropbox App Key
- **Required**: Yes
- **Environments**: Production, Preview, Development
- **Used in**: `api/dropbox-oauth-*`, `api/dropbox-access-token.js`

- **Key**: `DROPBOX_APP_SECRET`
- **Value**: Dropbox App Secret
- **Required**: Yes
- **Environments**: Production, Preview, Development

- **Key**: `DROPBOX_REFRESH_TOKEN`
- **Value**: Dropbox refresh token (from OAuth)
- **Required**: Yes
- **Environments**: Production, Preview, Development

- **Key**: `DROPBOX_REDIRECT_URI` (Optional)
- **Value**: OAuth redirect URL (e.g., `https://your-domain/api/dropbox-oauth-callback`)
- **Required**: No (auto-detected if omitted)
- **Environments**: Production, Preview, Development

- **Key**: `DROPBOX_SCOPES` (Optional)
- **Value**: Space-separated scopes (default: `files.content.write files.metadata.write sharing.write`)
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

#### 5. Dropbox (Client token - Optional, for testing only)
- **Key**: `VITE_DROPBOX_ACCESS_TOKEN`
- **Value**: Short-lived Dropbox access token
- **Required**: No (only for local testing)
- **Environments**: Development
- **Used in**: `src/services/dropboxService.js`

---

## Summary Table

### Server-Side Variables (Secure - No `VITE_` prefix)

| Variable Name | Purpose | Required | Default | Location |
|--------------|---------|----------|---------|----------|
| `DROPBOX_APP_KEY` | Dropbox app key | ✅ Yes | None | Serverless function |
| `DROPBOX_APP_SECRET` | Dropbox app secret | ✅ Yes | None | Serverless function |
| `DROPBOX_REFRESH_TOKEN` | Dropbox refresh token | ✅ Yes | None | Serverless function |
| `DROPBOX_REDIRECT_URI` | Dropbox redirect URI | ❌ No | Auto | Serverless function |
| `DROPBOX_SCOPES` | Dropbox scopes | ❌ No | Default | Serverless function |
| `EMAILJS_SERVICE_ID` | EmailJS service ID | ✅ Yes | None | Serverless function |
| `EMAILJS_TEMPLATE_ID` | Business owner email template | ✅ Yes | None | Serverless function |
| `EMAILJS_CUSTOMER_TEMPLATE_ID` | Customer confirmation template | ✅ Yes | None | Serverless function |
| `EMAILJS_PUBLIC_KEY` | EmailJS public key | ✅ Yes | None | Serverless function |
| `EMAILJS_PRIVATE_KEY` | EmailJS private key (access token) | ✅ Yes | None | Serverless function |

### Frontend Variables (Browser - WITH `VITE_` prefix)

| Variable Name | Purpose | Required | Default | Location |
|--------------|---------|----------|---------|----------|
| `VITE_WHATSAPP_NUMBER` | WhatsApp contact number | ✅ Yes | None | Frontend components |
| `VITE_DROPBOX_ACCESS_TOKEN` | Dropbox access token (dev only) | ❌ No | None | Frontend (optional) |

**Total**: 12 environment variables (10 server-side, 2 frontend)

---

## Where They're Used in Code

### Server-Side (Secure):
- `DROPBOX_APP_KEY` → `api/dropbox-oauth-*`, `api/dropbox-access-token.js`
- `DROPBOX_APP_SECRET` → `api/dropbox-oauth-*`, `api/dropbox-access-token.js`
- `DROPBOX_REFRESH_TOKEN` → `api/dropbox-access-token.js`
- `DROPBOX_REDIRECT_URI` → `api/dropbox-oauth-*` (optional)
- `DROPBOX_SCOPES` → `api/dropbox-oauth-url.js` (optional)
- `EMAILJS_SERVICE_ID` → `api/send-email.js` (serverless function)
- `EMAILJS_TEMPLATE_ID` → `api/send-email.js` (serverless function)
- `EMAILJS_CUSTOMER_TEMPLATE_ID` → `api/send-email.js` (serverless function)
- `EMAILJS_PUBLIC_KEY` → `api/send-email.js` (serverless function)
- `EMAILJS_PRIVATE_KEY` → `api/send-email.js` (serverless function)

### Frontend (Browser):
- `VITE_WHATSAPP_NUMBER` → `src/components/Footer.jsx` & `src/components/WhatsAppButton.jsx`
- `VITE_DROPBOX_ACCESS_TOKEN` → `src/services/dropboxService.js` (dev only)

---

## Quick Setup Checklist

### Server-Side Variables (NO `VITE_` prefix):
- [ ] `DROPBOX_APP_KEY` - Get from Dropbox app console
- [ ] `DROPBOX_APP_SECRET` - Get from Dropbox app console
- [ ] `DROPBOX_REFRESH_TOKEN` - Generate via OAuth flow
- [ ] `DROPBOX_REDIRECT_URI` - Set to `/api/dropbox-oauth-callback` (optional)
- [ ] `DROPBOX_SCOPES` - Optional scopes override
- [ ] `EMAILJS_SERVICE_ID` - Get from EmailJS dashboard
- [ ] `EMAILJS_TEMPLATE_ID` - Get from EmailJS templates (Business Owner)
- [ ] `EMAILJS_CUSTOMER_TEMPLATE_ID` - Get from EmailJS templates (Customer)
- [ ] `EMAILJS_PUBLIC_KEY` - Get from EmailJS account settings
- [ ] `EMAILJS_PRIVATE_KEY` - Get from EmailJS Dashboard → Account → Security

### Frontend Variables (WITH `VITE_` prefix):
- [ ] `VITE_WHATSAPP_NUMBER` - Your WhatsApp number (no +, no spaces)
- [ ] `VITE_DROPBOX_ACCESS_TOKEN` - Dropbox token (dev only)

---

## Notes

### Security Update:
- ✅ **Server-side variables** (Dropbox, EmailJS) use NO `VITE_` prefix - they stay secure on the server
- ✅ **Frontend variables** (WhatsApp) use `VITE_` prefix - only safe for public use
- ⚠️ `VITE_DROPBOX_ACCESS_TOKEN` is for local testing only
- ✅ After adding variables in Vercel, **redeploy** your site for changes to take effect
- ✅ Server-side variables are **NEVER exposed** to the browser (secure!)

### Setup Guides:
- `SECURE_SETUP_STEPS.md` - Step-by-step setup instructions
- `SECURE_API_SETUP.md` - Detailed architecture and security info
- `DROPBOX_SETUP.md` - Dropbox API setup (if added)
- `EMAILJS_SETUP.md` - EmailJS setup (updated for serverless)

