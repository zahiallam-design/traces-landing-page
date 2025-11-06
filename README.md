# Your Albums Landing Page - React Version

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

2. **Configure Smash API**:
   - Open `src/components/UploadSection.jsx`
   - Replace `YOUR_SMASH_API_KEY` with your actual API key (line 5)
   - See `SMASH_SETUP.md` for detailed instructions

3. **Configure EmailJS** (Required for receiving orders):
   - Follow the setup guide in `EMAILJS_SETUP.md`
   - Create an EmailJS account and configure your email service
   - Update credentials in `src/services/emailService.js`
   - This allows you to receive order emails when customers place orders

4. **Configure WhatsApp**:
   - Open `src/components/Footer.jsx` and `src/components/WhatsAppButton.jsx`
   - Replace `YOUR_NUMBER` with your WhatsApp number (format: country code + number, no + or spaces)

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
│   ├── ExtrasSection.jsx
│   ├── OrderForm.jsx
│   ├── Gallery.jsx
│   ├── Footer.jsx
│   └── WhatsAppButton.jsx
├── hooks/
│   └── useBreakpoint.js  # Custom breakpoint hook
├── App.jsx              # Main app component
├── main.jsx             # Entry point
└── index.css            # Global styles
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

### ExtrasSection
- `notes`: Notes text value
- `onNotesChange`: Callback `(text) => void`
- `giftWrap`: Boolean gift wrap state
- `onGiftWrapChange`: Callback `(checked) => void`

### OrderForm
- `selectedAlbum`: Selected album object
- `selectedColor`: Selected color
- `giftWrap`: Gift wrap boolean
- `notes`: Notes text
- `smashTransferUrl`: Smash transfer URL from upload
- `fileCount`: Number of uploaded files
- `onSubmit`: Callback `(orderData) => void`

## Deployment

**Want to get online quickly?** See `QUICK_DEPLOY.md` for the fastest path!

**For detailed instructions:** See `DEPLOYMENT.md` for complete deployment guide.

### Quick Summary

**Vercel (Recommended - Easiest)**:
1. Push code to GitHub
2. Import in Vercel → Deploy
3. Done! Your site is live in 2 minutes

**Netlify**:
1. Push code to GitHub
2. Connect in Netlify → Deploy
3. Done!

**GitHub Pages**:
1. Install `gh-pages`: `npm install --save-dev gh-pages`
2. Add deploy scripts to package.json
3. Run `npm run deploy`

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

## Support

- For Smash API setup, see `SMASH_SETUP.md`
- For EmailJS setup, see `EMAILJS_SETUP.md`

