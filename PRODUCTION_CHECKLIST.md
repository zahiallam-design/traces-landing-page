# Production Readiness Checklist

Use this checklist to ensure your landing page is ready for production deployment.

## Pre-Deployment

### Code Quality
- [x] All components are functional and tested locally
- [x] No console errors in browser
- [x] Build completes successfully (`npm run build`)
- [x] Production preview works (`npm run preview`)

### Configuration
- [ ] **Smash API**: Key configured (can be done after deployment)
- [ ] **EmailJS**: Credentials configured (can be done after deployment)
- [ ] **WhatsApp**: Number configured (can be done after deployment)
- [ ] **Logo**: Added to `public/logo.png` (optional)

### Security
- [x] `.env` file is in `.gitignore`
- [x] No sensitive data hardcoded in source files
- [x] Environment variables supported for API keys

### Performance
- [x] Production build optimizations enabled
- [x] Code splitting configured
- [x] Images optimized (if using real images)

---

## Deployment

### GitHub Setup
- [ ] Repository created on GitHub
- [ ] Code pushed to GitHub
- [ ] Repository is accessible

### Vercel Setup
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Initial deployment successful
- [ ] Site URL accessible

### Environment Variables
- [ ] `VITE_SMASH_API_KEY` added in Vercel
- [ ] `VITE_SMASH_REGION` added in Vercel (optional, defaults to `eu-west-3`)
- [ ] `VITE_EMAILJS_SERVICE_ID` added in Vercel
- [ ] `VITE_EMAILJS_TEMPLATE_ID` added in Vercel
- [ ] `VITE_EMAILJS_CUSTOMER_TEMPLATE_ID` added in Vercel
- [ ] `VITE_EMAILJS_PUBLIC_KEY` added in Vercel
- [ ] `VITE_WHATSAPP_NUMBER` added in Vercel
- [ ] Site redeployed after adding variables

**📋 See `ENVIRONMENT_VARIABLES.md` for complete reference**

---

## Post-Deployment Testing

### Basic Functionality
- [ ] Site loads without errors
- [ ] All pages/sections accessible
- [ ] Navigation works smoothly
- [ ] Mobile responsive design works
- [ ] Tablet responsive design works

### Features
- [ ] Album selection works (size and color)
- [ ] Photo upload works (Smash integration)
- [ ] Upload progress indicator works
- [ ] Order form validation works
- [ ] Order submission works
- [ ] Email is received when order is placed
- [ ] WhatsApp links work correctly

### Cross-Browser Testing
- [ ] Chrome/Edge works
- [ ] Firefox works
- [ ] Safari works (if possible)
- [ ] Mobile browsers work

### Performance
- [ ] Page loads quickly (< 3 seconds)
- [ ] Images load properly
- [ ] No console errors
- [ ] No broken links

---

## Configuration (After Deployment)

### EmailJS Setup
- [ ] EmailJS account created
- [ ] Email service connected (Gmail/other)
- [ ] Email template created
- [ ] Template tested successfully
- [ ] Order emails received correctly

### Smash API Setup
- [ ] Smash developer account created
- [ ] API key generated
- [ ] API key added to Vercel environment variables
- [ ] Upload functionality tested

### WhatsApp Setup
- [ ] WhatsApp number verified
- [ ] Number added to Vercel environment variables
- [ ] Links tested and working

---

## Optional Enhancements

### Custom Domain
- [ ] Domain purchased
- [ ] Domain added to Vercel
- [ ] DNS configured
- [ ] HTTPS certificate active

### Analytics (Optional)
- [ ] Google Analytics added (if desired)
- [ ] Tracking code configured

### SEO (Optional)
- [ ] Meta description added
- [ ] Open Graph tags added (if desired)
- [ ] Sitemap created (if desired)

---

## Monitoring

### After Launch
- [ ] Monitor order emails daily
- [ ] Check for error reports
- [ ] Monitor site uptime
- [ ] Review user feedback

---

## Quick Test Script

Run through this quick test after deployment:

1. **Load Site**: Visit your Vercel URL
2. **Select Album**: Choose 50 photos, green color
3. **Upload Photo**: Upload a test image
4. **Fill Form**: Enter test customer details
5. **Submit Order**: Click "Place Order"
6. **Check Email**: Verify order email received
7. **Test WhatsApp**: Click WhatsApp button/link

If all steps pass, your site is production-ready! ✅

---

## Need Help?

- **Deployment Issues**: See `VERCEL_DEPLOYMENT.md`
- **EmailJS Setup**: See `EMAILJS_SETUP.md`
- **Smash Setup**: See `SMASH_SETUP.md`
- **General Questions**: Check `README.md`

