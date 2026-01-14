# QA Test Sheet - Traces Landing Page

## Test Environment
- **URL**: https://traces-leb.vercel.app/
- **Date**: _______________
- **Tester**: _______________
- **Browser**: _______________
- **Device**: Desktop / Mobile / Tablet

---

## 1. Initial Page Load & Navigation

### 1.1 Page Load
- [ ] Page loads without errors
- [ ] No console errors (check browser DevTools)
- [ ] Favicon displays correctly (`fav.png`)
- [ ] Header logo displays correctly (`Traces_1.png`)
- [ ] All sections are visible and properly styled

### 1.2 Navigation
- [ ] "Start Your Order" button scrolls to album count selector
- [ ] "Contact" button in header scrolls to footer contact section
- [ ] Smooth scrolling works on all links

---

## 2. Album Count Selection

### 2.1 Basic Selection
- [ ] Can select 1, 2, 3, 4, or 5 albums
- [ ] Selected count is highlighted correctly
- [ ] Page scrolls to album sections after selection
- [ ] Order number is generated when count is selected

### 2.2 Adding Albums
- [ ] Can increase album count (e.g., from 2 to 3)
- [ ] Existing albums are preserved when adding more
- [ ] New albums are added correctly

### 2.3 Removing Albums (via Count Selector)
- [ ] Cannot reduce album count via selector (buttons disabled)
- [ ] Lower count buttons show disabled state
- [ ] Tooltip appears explaining why reduction is disabled

---

## 3. Album Selection & Configuration

### 3.1 Size Selection
- [ ] Can select 52 photos ($33) or 100 photos ($47)
- [ ] Selected size is highlighted
- [ ] Page scrolls to color selection after size selection
- [ ] Error badge appears if trying to submit without size

### 3.2 Color Selection
- [ ] Can select Green or Grey album color
- [ ] Album images display correctly (Green Album.jpeg, Grey Album.jpeg)
- [ ] Images have white background
- [ ] Selected color is highlighted
- [ ] Page scrolls to upload section after color selection
- [ ] Error badge appears if trying to submit without color
- [ ] No color is pre-selected by default

### 3.3 Cancel Album Button
- [ ] "Cancel Album" button appears below album title
- [ ] Button is centered
- [ ] Button is grey colored (#929191)
- [ ] Button is disabled when album is uploading
- [ ] Button is disabled when only 1 album remains
- [ ] Tooltip shows correct message when disabled
- [ ] Clicking button removes album correctly
- [ ] Album count selector updates to reflect new count
- [ ] Remaining albums are re-indexed correctly (Album 1, Album 2, etc.)
- [ ] Cannot cancel album while it's uploading

---

## 4. Photo Upload Section

### 4.1 File Selection
- [ ] Can select multiple images via file picker
- [ ] Can drag and drop images
- [ ] Tip message appears before file selection explaining order matters
- [ ] Tip message disappears after files are selected
- [ ] Counter shows "X of 52 selected" or "X of 100 selected"
- [ ] Counter is bold and left-aligned
- [ ] Counter turns red if over limit

### 4.2 File Validation
- [ ] Supports: JPEG, JPG, PNG, WEBP, HEIC, HEIF, AVIF
- [ ] Rejects GIF files with error message
- [ ] Rejects RAW files (.dng, .cr2, .nef, etc.) with warning
- [ ] RAW files are listed in yellow warning box
- [ ] Yellow RAW box is scrollable if more than 5 files
- [ ] Valid images are still processed even if RAW files are rejected
- [ ] Success message appears: "The below images you selected have been added successfully, waiting for you to upload them."
- [ ] Success message is placed after counter and before drag tip

### 4.3 File Limit
- [ ] Cannot upload more than album capacity (52 or 100)
- [ ] Error message appears if over limit
- [ ] Upload button is disabled if over limit
- [ ] Counter shows correct limit based on album size

### 4.4 File Reordering
- [ ] Can reorder files using up/down arrow buttons
- [ ] Up button disabled for first file
- [ ] Down button disabled for last file
- [ ] Buttons are disabled during upload/compression
- [ ] Files maintain order after reordering
- [ ] Drag note appears: "Images are listed in your selection order. Want to change it? Use the up/down arrows (↑↓) to reorder."

### 4.5 File Removal
- [ ] Can remove individual files before upload
- [ ] Cannot remove files during upload/compression
- [ ] Remove button (×) is disabled during upload
- [ ] Tooltip explains why removal is disabled
- [ ] Counter updates when files are removed

### 4.6 Image Compression
- [ ] Large images (>4MB) are automatically compressed
- [ ] Compression progress shows "Compressing images..."
- [ ] Progress bar shows compression progress
- [ ] Compression targets 2-3MB file size
- [ ] Message appears: "💡 You can continue the process and scroll down to customize your cover while compression is in progress."
- [ ] Compression completes successfully

### 4.7 Image Upload
- [ ] Upload button is visible and clickable
- [ ] Upload starts when button is clicked
- [ ] Progress shows "Uploading... X of Y images"
- [ ] Progress bar shows upload progress
- [ ] Message appears: "⏱️ This may take a few minutes depending on your internet connection speed and image sizes."
- [ ] Message appears: "💡 You can continue the process and scroll down to customize your cover while upload is in progress."
- [ ] "Cancel Upload" button appears during upload
- [ ] Cancel button stops upload correctly
- [ ] Files are renamed to `photo_01_ordernumber.extension` format
- [ ] Upload completes successfully
- [ ] Success message appears after upload
- [ ] "Clear All & Start Over" button appears after upload

### 4.8 Upload State Management
- [ ] Files are locked (cannot reorder/remove) during upload
- [ ] Files are locked (cannot reorder/remove) during compression
- [ ] Submit order button is disabled during upload
- [ ] Message appears below submit button: "⏳ Upload in progress... Please wait for upload to complete before submitting your order."
- [ ] Cover customization section is accessible during upload

### 4.9 Error Handling
- [ ] Error messages appear for failed uploads
- [ ] Network errors are handled gracefully
- [ ] Large batch uploads are split correctly (prevents 413 errors)
- [ ] Timeout errors are handled (60-second timeout per batch)

---

## 5. Cover Customization

### 5.1 Section Visibility
- [ ] Cover customization appears when upload starts (not before)
- [ ] Cover customization remains visible after upload completes
- [ ] Section is accessible during upload

### 5.2 Image Cover
- [ ] Can select "Image Cover" option
- [ ] File picker opens when Image Cover is selected
- [ ] Can select cover image
- [ ] Non-square images trigger crop modal
- [ ] Crop modal displays image correctly
- [ ] Crop square is visible and draggable
- [ ] Zoom slider works correctly
- [ ] "Apply Crop" button is above "Cancel" button (on mobile)
- [ ] Cropped image is processed and placed on A6 white background
- [ ] Preview shows cropped square (not A6 version)
- [ ] Success message appears: "✓ Cover image uploaded successfully! You can now proceed."
- [ ] Square images are processed without cropping
- [ ] Cover size note is removed (no longer shown before upload)
- [ ] Error badge appears if trying to submit without cover image

### 5.3 Text Cover
- [ ] Can select "Text Cover" option
- [ ] Title input field appears
- [ ] Title is mandatory (cannot submit without it)
- [ ] Color selection appears (Grey #5d5575, Red #ff3131)
- [ ] Color selection is mandatory
- [ ] Live preview shows text in "Holiday" font
- [ ] Preview updates as title is typed
- [ ] Preview shows correct color (Grey or Red)
- [ ] Font weight is 400 (not bold)
- [ ] Error badge appears if trying to submit without title or color
- [ ] Error messages appear for missing title/color

### 5.4 Cover Validation
- [ ] Cannot submit order without cover
- [ ] Error badge appears on cover section if missing
- [ ] Page scrolls to cover section if missing on submit

---

## 6. Order Form

### 6.1 Customer Details
- [ ] Full Name field is required
- [ ] Mobile Number field is required
- [ ] Email field is optional
- [ ] All fields accept input correctly

### 6.2 Delivery Address
- [ ] Town/City field is required
- [ ] Street Address & Details field is required
- [ ] Both fields are separate (not combined)
- [ ] Both fields are mandatory

### 6.3 Notes Sections
- [ ] "Delivery Notes" textarea appears
- [ ] Placeholder text is correct: "Any special instructions for delivery..."
- [ ] "Notes for Us" textarea appears
- [ ] Placeholder text is correct: "Any special notes for us"
- [ ] Both notes sections are optional
- [ ] No redundant helper text below textareas

### 6.4 Order Summary
- [ ] Order summary displays all albums correctly
- [ ] Prices are correct ($33 for 52 photos, $47 for 100 photos)
- [ ] Delivery charge shows $4 (or $0 if subtotal >= $90)
- [ ] Free delivery message appears if order >= $90
- [ ] Total calculation is correct
- [ ] On mobile: Order summary appears after form fields, before submit button

### 6.5 Disclaimer
- [ ] Disclaimer is a bulleted list
- [ ] Includes confirmation message point
- [ ] Includes delivery time (3-5 days)
- [ ] Includes notes about photo deletion

### 6.6 Submit Button
- [ ] Button text: "Place Order – Pay on Delivery"
- [ ] Button is disabled during upload
- [ ] Message appears: "⏳ Upload in progress... Please wait for upload to complete before submitting your order."
- [ ] Button shows "Submitting Order..." when clicked
- [ ] Button is disabled during submission

---

## 7. Order Submission & Validation

### 7.1 Validation Errors
- [ ] Missing album size shows error badge
- [ ] Missing album color shows error badge
- [ ] Missing photos shows error badge
- [ ] Missing cover shows error badge
- [ ] Missing text cover title shows error badge
- [ ] Missing text cover color shows error badge
- [ ] Missing customer name shows error
- [ ] Missing mobile number shows error
- [ ] Missing delivery town shows error
- [ ] Missing delivery address shows error
- [ ] Page scrolls to first error automatically
- [ ] Error badges disappear when step is completed
- [ ] No alert() popups (all errors are visual)

### 7.2 Order Submission
- [ ] Order submits successfully when all fields are filled
- [ ] Order number is generated correctly (timestamp-based)
- [ ] Order number is unique and increasing
- [ ] Success modal appears after submission
- [ ] Modal shows order summary correctly
- [ ] All album details are correct in summary
- [ ] Cover details show text color if text cover
- [ ] Delivery charge is shown correctly
- [ ] Notes for Us are included in summary

### 7.3 PDF Download
- [ ] "Download Order Summary" button appears in success modal
- [ ] Clicking button downloads PDF
- [ ] PDF includes all order details
- [ ] PDF includes order number
- [ ] PDF includes customer details
- [ ] PDF includes all albums with correct details
- [ ] PDF includes cover information (with text color if applicable)
- [ ] PDF includes delivery address (town + address)
- [ ] PDF includes delivery notes
- [ ] PDF includes notes for us
- [ ] PDF includes subtotal, delivery charge, and total
- [ ] PDF includes delivery time (3-5 days)
- [ ] PDF includes contact information (Traces, email, WhatsApp)
- [ ] PDF is professional and well-formatted

### 7.4 Email Sending
- [ ] Business owner receives email
- [ ] Email includes all order details
- [ ] Email includes text cover color if text cover
- [ ] Email includes WhatsApp link for customer
- [ ] Customer receives email if email was provided
- [ ] Customer email includes all order details
- [ ] Customer email includes text cover color if text cover
- [ ] Email includes note to check junk/spam folder
- [ ] Email sending doesn't block order submission if it fails

### 7.5 Post-Submission
- [ ] Page refreshes to top after closing modal
- [ ] Page resets to initial state
- [ ] All form fields are cleared
- [ ] All albums are cleared

---

## 8. Mobile/Responsive Testing

### 8.1 Mobile Layout
- [ ] All sections are readable on mobile
- [ ] Buttons are touch-friendly
- [ ] Forms are easy to fill on mobile
- [ ] Order summary appears in correct position on mobile
- [ ] Crop modal buttons are in correct order (Apply Crop above Cancel)

### 8.2 Mobile Interactions
- [ ] File selection works on mobile
- [ ] Up/down arrow buttons work for reordering
- [ ] No navigation to search page when dragging files
- [ ] Touch interactions work correctly
- [ ] Scroll behavior is smooth

---

## 9. Edge Cases & Error Scenarios

### 9.1 Upload Edge Cases
- [ ] Can cancel upload mid-process
- [ ] Can add more images after initial upload (re-upload)
- [ ] Progress resets correctly when re-uploading
- [ ] Files are locked after upload (cannot remove individually)
- [ ] "Clear All" button works to start over
- [ ] Large batches are split correctly (prevents 413 errors)
- [ ] Network timeout is handled (60 seconds)

### 9.2 Album Management Edge Cases
- [ ] Cannot remove album while uploading
- [ ] Cannot remove last remaining album
- [ ] Album count selector updates when album is canceled
- [ ] Remaining albums are re-indexed correctly
- [ ] Upload states are preserved correctly when albums are reordered

### 9.3 Cover Edge Cases
- [ ] Can switch between image and text cover
- [ ] Can change cover image after initial selection
- [ ] Can change text cover title/color after initial selection
- [ ] Cover validation works correctly for both types
- [ ] A6 processing happens in background (user doesn't see it)

### 9.4 Form Edge Cases
- [ ] Can submit with optional email field empty
- [ ] Can submit with optional notes fields empty
- [ ] Form validation prevents submission with missing required fields
- [ ] Order number is generated only once (when album count is selected)

---

## 10. Visual & UI Testing

### 10.1 Colors
- [ ] Green color is correct (#8DB7A5)
- [ ] Grey color is correct (#929191)
- [ ] Text cover colors are correct (Grey #5d5575, Red #ff3131)
- [ ] Error badges are red
- [ ] Success messages are green

### 10.2 Typography
- [ ] Holiday font loads correctly for text cover preview
- [ ] Font weight is 400 (not bold)
- [ ] All text is readable
- [ ] Text sizes are appropriate

### 10.3 Images
- [ ] Album images display correctly (Green Album.jpeg, Grey Album.jpeg)
- [ ] Album images have white background
- [ ] Logo displays correctly (Traces_1.png)
- [ ] Logo is enlarged by 20%
- [ ] Favicon displays correctly (fav.png)

### 10.4 Spacing & Layout
- [ ] Free delivery note has correct spacing from "Start Your Order" button
- [ ] Yellow RAW box has good spacing
- [ ] Counter has 50% more spacing above yellow box
- [ ] All sections have consistent spacing
- [ ] Mobile layout is well-spaced

---

## 11. Performance Testing

### 11.1 Image Handling
- [ ] Large images (9MB, 20MB) compress correctly
- [ ] Compression doesn't take too long
- [ ] Upload progress is accurate
- [ ] Multiple large images upload successfully
- [ ] Batch splitting works for large uploads

### 11.2 Page Performance
- [ ] Page loads quickly
- [ ] No memory leaks
- [ ] Smooth scrolling
- [ ] No lag when interacting with forms

---

## 12. Cross-Browser Testing

### 12.1 Desktop Browsers
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### 12.2 Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Samsung Internet

---

## 13. Integration Testing

### 13.1 Smash API
- [ ] Files upload to Smash correctly
- [ ] Transfer URLs are received
- [ ] File names are correct format (`photo_01_ordernumber.extension`)

### 13.2 Email Service
- [ ] Emails are sent correctly
- [ ] Email templates render correctly
- [ ] All data is included in emails
- [ ] WhatsApp link in business email works

### 13.3 PDF Generation
- [ ] PDF generates correctly
- [ ] All data is included
- [ ] PDF is downloadable
- [ ] PDF formatting is correct

---

## 14. Accessibility Testing

### 14.1 Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible

### 14.2 Screen Readers
- [ ] Alt text on images
- [ ] ARIA labels where needed
- [ ] Form labels are associated correctly

---

## 15. Security Testing

### 15.1 Data Handling
- [ ] No API keys exposed in frontend
- [ ] File uploads are validated
- [ ] No sensitive data in console logs

---

## Test Results Summary

### Passed: ___ / ___
### Failed: ___ / ___
### Blocked: ___ / ___

### Critical Issues Found:
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Minor Issues Found:
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Notes:
_________________________________________________
_________________________________________________
_________________________________________________

---

## Sign-off

**Tester Name**: _______________  
**Date**: _______________  
**Status**: ☐ Pass  ☐ Fail  ☐ Needs Review  
**Comments**: _________________________________________________
