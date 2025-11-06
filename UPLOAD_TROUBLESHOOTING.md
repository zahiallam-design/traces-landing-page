# Upload Troubleshooting Guide

If uploads are stuck at 0% or not working, follow these steps:

## Quick Checks

### 1. Check Browser Console
Open browser DevTools (F12) → Console tab and look for:
- ❌ Red error messages
- ⚠️ Yellow warnings
- 📝 Console logs from the upload process

**Common errors to look for:**
- `Smash SDK not loaded`
- `401 Unauthorized` (invalid API key)
- `403 Forbidden` (API key permissions)
- `Network error` or `CORS error`

### 2. Verify API Key is Set

**In Browser Console, run:**
```javascript
console.log('API Key:', import.meta.env.VITE_SMASH_API_KEY);
```

**Expected:** Should show your actual API key (not `YOUR_SMASH_API_KEY` or `undefined`)

**If undefined:**
- Check Vercel environment variables are set
- Make sure you redeployed after adding variables
- Verify variable name is exactly `VITE_SMASH_API_KEY`

### 3. Check Smash SDK is Loaded

**In Browser Console, run:**
```javascript
console.log('SmashUploader:', typeof SmashUploader);
```

**Expected:** Should show `"function"` (not `"undefined"`)

**If undefined:**
- Check `index.html` has the Smash SDK script tag
- Check browser network tab for script loading errors
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

## Common Issues & Solutions

### Issue 1: Upload Stuck at 0%

**Possible causes:**
1. **API key not configured**
   - Check Vercel environment variables
   - Verify `VITE_SMASH_API_KEY` is set
   - Redeploy after adding

2. **Invalid API key**
   - Verify API key in Smash dashboard
   - Check for extra spaces or characters
   - Make sure key is active/not expired

3. **Smash SDK not loading**
   - Check browser console for script errors
   - Verify script tag in `index.html`
   - Check network tab for failed requests

4. **Network/CORS issues**
   - Check browser console for CORS errors
   - Try different network/WiFi
   - Check firewall/antivirus blocking

**Solution:**
- Open browser console (F12)
- Look for error messages
- Check the console logs we added (they show upload progress)

### Issue 2: "Smash SDK not loaded" Error

**Cause:** The Smash SDK script isn't loading from CDN

**Solutions:**
1. Check `index.html` line 10 has:
   ```html
   <script src="https://unpkg.com/@smash-sdk/uploader/dist/SmashUploader.browser.js"></script>
   ```

2. Check browser Network tab:
   - Look for `SmashUploader.browser.js`
   - Should show status 200 (success)
   - If 404/error, CDN might be down

3. Try alternative CDN:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@smash-sdk/uploader@latest/dist/SmashUploader.browser.js"></script>
   ```

### Issue 3: "401 Unauthorized" or "403 Forbidden"

**Cause:** Invalid or expired API key

**Solutions:**
1. Verify API key in Smash dashboard
2. Generate a new API key if needed
3. Update `VITE_SMASH_API_KEY` in Vercel
4. Redeploy

### Issue 4: Progress Never Updates

**Cause:** Progress events not firing (but upload might still work)

**Check:**
- Look in browser console for "Upload progress event" logs
- If you see them, progress is working
- If upload completes but progress stuck, it's a display issue

**Solution:**
- Upload might still succeed - check for success message
- If upload completes, this is just a UI issue

### Issue 5: Files Too Large

**Cause:** File size exceeds Smash plan limits

**Check:**
- Smash free tier has file size limits
- Check your Smash account limits
- Try with smaller files first

---

## Debugging Steps

### Step 1: Enable Console Logging

The code now includes console logs. Check browser console for:
- `Initializing Smash uploader...`
- `Starting upload...`
- `Upload progress event:`
- `Upload result:`

### Step 2: Test API Key

**In Browser Console:**
```javascript
// Check if API key is accessible
console.log('API Key exists:', !!import.meta.env.VITE_SMASH_API_KEY);
console.log('API Key length:', import.meta.env.VITE_SMASH_API_KEY?.length);
```

### Step 3: Test Smash SDK

**In Browser Console:**
```javascript
// Check if SDK is loaded
console.log('SmashUploader type:', typeof SmashUploader);

// Try creating uploader (will fail if API key invalid)
try {
  const testUploader = new SmashUploader({
    region: 'eu-west-3',
    token: import.meta.env.VITE_SMASH_API_KEY
  });
  console.log('Uploader created successfully');
} catch (e) {
  console.error('Failed to create uploader:', e);
}
```

### Step 4: Check Network Requests

1. Open DevTools → Network tab
2. Try uploading a file
3. Look for requests to Smash API
4. Check request status codes:
   - **200**: Success
   - **401**: Invalid API key
   - **403**: Permission denied
   - **500**: Server error

---

## Still Not Working?

1. **Check Smash Account:**
   - Log into Smash dashboard
   - Verify API key is active
   - Check account limits/quota
   - Verify region matches (`eu-west-3` or `us-east-1`)

2. **Test with Minimal Setup:**
   - Try uploading just 1 small image
   - Use a different browser
   - Try incognito/private mode

3. **Contact Support:**
   - Smash API docs: https://api.fromsmash.com/docs
   - Check Smash status page
   - Contact Smash support

---

## Quick Test Checklist

- [ ] Browser console shows no errors
- [ ] `VITE_SMASH_API_KEY` is set in Vercel
- [ ] Site was redeployed after adding variables
- [ ] Smash SDK script loads (check Network tab)
- [ ] API key is valid (check Smash dashboard)
- [ ] Files are images (JPG, PNG, HEIC)
- [ ] File sizes are within limits
- [ ] Network connection is stable

