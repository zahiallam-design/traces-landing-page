# Environment Variables Reference

Complete list of all environment variables used in the project.

## Complete List

Add these environment variables in **Vercel** (Settings → Environment Variables):

### 1. Smash API
- **Key**: `VITE_SMASH_API_KEY`
- **Value**: Your Smash API key
- **Required**: Yes
- **Environments**: Production, Preview, Development

- **Key**: `VITE_SMASH_REGION` (Optional)
- **Value**: `eu-west-3` or `us-east-1`
- **Default**: `eu-west-3` (if not set)
- **Required**: No
- **Environments**: Production, Preview, Development

### 2. EmailJS - Business Owner Email
- **Key**: `VITE_EMAILJS_SERVICE_ID`
- **Value**: Your EmailJS Service ID
- **Required**: Yes
- **Environments**: Production, Preview, Development

- **Key**: `VITE_EMAILJS_TEMPLATE_ID`
- **Value**: Your EmailJS Template ID (Business Owner template)
- **Required**: Yes
- **Environments**: Production, Preview, Development

- **Key**: `VITE_EMAILJS_PUBLIC_KEY`
- **Value**: Your EmailJS Public Key
- **Required**: Yes
- **Environments**: Production, Preview, Development

### 3. EmailJS - Customer Confirmation Email
- **Key**: `VITE_EMAILJS_CUSTOMER_TEMPLATE_ID`
- **Value**: Your EmailJS Customer Template ID (Customer confirmation template)
- **Required**: Yes (for customer emails to work)
- **Environments**: Production, Preview, Development

### 4. WhatsApp
- **Key**: `VITE_WHATSAPP_NUMBER`
- **Value**: Your WhatsApp number (format: country code + number, no + or spaces)
- **Example**: `1234567890`
- **Required**: Yes
- **Environments**: Production, Preview, Development

---

## Summary Table

| Variable Name | Purpose | Required | Default |
|--------------|---------|----------|---------|
| `VITE_SMASH_API_KEY` | Smash API key for photo uploads | ✅ Yes | None |
| `VITE_SMASH_REGION` | Smash API region | ❌ No | `eu-west-3` |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service ID | ✅ Yes | None |
| `VITE_EMAILJS_TEMPLATE_ID` | Business owner email template | ✅ Yes | None |
| `VITE_EMAILJS_CUSTOMER_TEMPLATE_ID` | Customer confirmation template | ✅ Yes | None |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key | ✅ Yes | None |
| `VITE_WHATSAPP_NUMBER` | WhatsApp contact number | ✅ Yes | None |

**Total**: 7 environment variables (6 required, 1 optional)

---

## Where They're Used in Code

- `VITE_SMASH_API_KEY` → `src/components/UploadSection.jsx`
- `VITE_SMASH_REGION` → `src/components/UploadSection.jsx`
- `VITE_EMAILJS_SERVICE_ID` → `src/services/emailService.js`
- `VITE_EMAILJS_TEMPLATE_ID` → `src/services/emailService.js`
- `VITE_EMAILJS_CUSTOMER_TEMPLATE_ID` → `src/services/emailService.js`
- `VITE_EMAILJS_PUBLIC_KEY` → `src/services/emailService.js`
- `VITE_WHATSAPP_NUMBER` → `src/components/Footer.jsx` & `src/components/WhatsAppButton.jsx`

---

## Quick Setup Checklist

- [ ] `VITE_SMASH_API_KEY` - Get from Smash dashboard
- [ ] `VITE_SMASH_REGION` - Set to `eu-west-3` or `us-east-1` (optional)
- [ ] `VITE_EMAILJS_SERVICE_ID` - Get from EmailJS dashboard
- [ ] `VITE_EMAILJS_TEMPLATE_ID` - Get from EmailJS templates (Business Owner)
- [ ] `VITE_EMAILJS_CUSTOMER_TEMPLATE_ID` - Get from EmailJS templates (Customer)
- [ ] `VITE_EMAILJS_PUBLIC_KEY` - Get from EmailJS account settings
- [ ] `VITE_WHATSAPP_NUMBER` - Your WhatsApp number (no +, no spaces)

---

## Notes

- All variables must start with `VITE_` to be accessible in the browser
- After adding variables in Vercel, **redeploy** your site for changes to take effect
- Variables are exposed to the browser (this is normal for frontend apps)
- See individual setup guides for detailed instructions:
  - `SMASH_SETUP.md` - Smash API setup
  - `EMAILJS_SETUP.md` - EmailJS setup

