# Traces Landing Page - React Version

A modern React-based landing page for your photo album service with custom breakpoints and responsive design.

## Features

- **React 18** with modern hooks and functional components
- **Custom Breakpoints**: Responsive design using your specified breakpoints (xs, ss, sm, ms, md, ml, lg, mx, xt, xl, xxl)
- **Direct Photo Upload**: Smash API integration for seamless file uploads
- **Component-Based Architecture**: Modular, reusable components
- **Mobile-First**: Optimized for phones, tablets, and laptops
- **Smooth Animations**: Modern UI with smooth scrolling and transitions

## Custom Breakpoints

The project uses your custom breakpoint system:

```javascript
{
  xs: 0,      // Extra small
  ss: 300,    // Small small
  sm: 600,    // Small
  ms: 750,    // Medium small
  md: 900,    // Medium
  ml: 1000,   // Medium large
  lg: 1200,   // Large
  mx: 1300,   // Max
  xt: 1440,   // Extra tall
  xl: 1728,   // Extra large
  xxl: 1820   // Extra extra large
}
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn/pnpm

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables** (After deployment):
   - See `ENVIRONMENT_VARIABLES.md` for complete list
   - Add all variables in Vercel: Settings → Environment Variables
   - **Server-side variables** (no `VITE_` prefix):
     - `SMASH_API_KEY` - See `SMASH_SETUP.md`
     - `SMASH_REGION` - Optional (defaults to `eu-west-3`)
     - `EMAILJS_SERVICE_ID` - See `EMAILJS_SETUP.md`
     - `EMAILJS_TEMPLATE_ID` - See `EMAILJS_SETUP.md`
     - `EMAILJS_CUSTOMER_TEMPLATE_ID` - See `EMAILJS_SETUP.md`
     - `EMAILJS_PUBLIC_KEY` - See `EMAILJS_SETUP.md`
     - `EMAILJS_PRIVATE_KEY` - See `EMAILJS_SETUP.md`
   - **Frontend variables** (with `VITE_` prefix):
     - `VITE_WHATSAPP_NUMBER` - Your WhatsApp number

5. **Add Logo**:
   - Place your logo as `public/logo.png`
   - Or update the logo path in `src/components/Header.jsx`

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.jsx
│   ├── Hero.jsx
│   ├── HowItWorks.jsx
│   ├── AlbumOptions.jsx
│   ├── UploadSection.jsx
│   ├── OrderForm.jsx
│   ├── Gallery.jsx
│   ├── Footer.jsx
│   └── WhatsAppButton.jsx
├── hooks/
│   └── useBreakpoint.js  # Custom breakpoint hook
├── services/
│   └── emailService.js  # Email sending service
├── App.jsx              # Main app component
├── main.jsx             # Entry point
└── index.css            # Global styles
api/
├── upload.js            # Serverless function for Smash API uploads
└── send-email.js        # Serverless function for EmailJS
```

## Using Breakpoints

The `useBreakpoint` hook provides responsive functionality:

```jsx
import { useBreakpoint } from '../hooks/useBreakpoint';

function MyComponent() {
  const breakpoint = useBreakpoint();
  const isMobile = ['xs', 'ss', 'sm'].includes(breakpoint);
  
  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      Content
    </div>
  );
}
```

Or use `useMediaQuery` for specific breakpoint checks:

```jsx
import { useMediaQuery } from '../hooks/useBreakpoint';

function MyComponent() {
  const isTabletUp = useMediaQuery('md', 'up'); // >= 900px
  const isMobileDown = useMediaQuery('sm', 'down'); // <= 600px
  
  return <div>Content</div>;
}
```

## Component Props

### AlbumOptions
- `selectedAlbum`: Currently selected album object `{ size, price }`
- `onAlbumSelect`: Callback when album is selected
- `selectedColor`: Currently selected color ('green' | 'grey')
- `onColorChange`: Callback when color changes

### UploadSection
- `selectedAlbum`: Album object to determine max file count
- `onUploadComplete`: Callback `(transferUrl, fileCount) => void`

### OrderForm
- `selectedAlbum`: Selected album object
- `selectedColor`: Selected color
- `giftWrap`: Gift wrap boolean
- `onGiftWrapChange`: Callback `(checked) => void`
- `deliveryNotes`: Delivery notes text
- `onDeliveryNotesChange`: Callback `(text) => void`
- `smashTransferUrl`: Smash transfer URL from upload
- `fileCount`: Number of uploaded files
- `onSubmit`: Callback `(orderData) => void`
- `isSubmitting`: Boolean indicating if form is submitting

## Deployment

**📘 For complete step-by-step instructions:** See `VERCEL_DEPLOYMENT.md`

### Quick Summary

**Vercel (Recommended - Easiest)**:
1. Push code to GitHub
2. Import in Vercel → Deploy
3. Add environment variables (Smash, EmailJS, WhatsApp)
4. Redeploy
5. Done! Your site is live

See `VERCEL_DEPLOYMENT.md` for detailed instructions with screenshots and troubleshooting.

## Differences from Vanilla Version

- **State Management**: Uses React hooks instead of global variables
- **Component Architecture**: Modular, reusable components
- **Custom Breakpoints**: Uses your specified breakpoint system
- **Type Safety**: Better organization and prop validation ready
- **Performance**: React optimizations and virtual DOM

## Next Steps

1. ✅ **Email Integration**: EmailJS is set up - follow `EMAILJS_SETUP.md` to configure
2. **Backend Integration** (Optional): For advanced features, create a backend API
3. **Error Handling**: Add proper error boundaries and user feedback
4. **Form Validation**: Add client-side validation library (e.g., react-hook-form)
5. **Accessibility**: Enhance ARIA labels and keyboard navigation

## Security

This project uses **Vercel Serverless Functions** to keep API keys secure:
- Smash API key is stored server-side in `/api/upload.js`
- EmailJS credentials are stored server-side in `/api/send-email.js`
- Only frontend-safe variables (like WhatsApp number) use `VITE_` prefix

See `SECURE_API_SETUP.md` for details on the secure architecture.

## Support

- **Environment Variables**: See `ENVIRONMENT_VARIABLES.md` for complete reference
- **Smash API Setup**: See `SMASH_SETUP.md`
- **EmailJS Setup**: See `EMAILJS_SETUP.md`
- **Deployment**: See `VERCEL_DEPLOYMENT.md`
- **Security Architecture**: See `SECURE_API_SETUP.md`

