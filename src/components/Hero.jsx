import React from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './Hero.css';

function Hero() {
  const breakpoint = useBreakpoint();
  const isMobile = ['xs', 'ss', 'sm'].includes(breakpoint);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleWhatsAppOrder = () => {
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '71532156';
    const cleanNumber = whatsappNumber.replace(/[\s\-+()]/g, '');
    // Add country code if missing (Lebanon: 961)
    const fullNumber = cleanNumber.startsWith('961') ? cleanNumber : `961${cleanNumber}`;
    
    // Format WhatsApp message with blank template (no pre-filled data)
    let message = '*Order*\n';
    message += `Album #:\n`;
    message += `- Size (52 or 100 photos): \n`;
    message += `- Color (Grey or Green): \n`;
    message += `- Cover: (text or image)\n`;
    message += `    - If image please send it to us, it will be cropped to a square to fit the cover format\n`;
    message += `    - If text please write it down:\n`;
    message += `        - Text:\n`;
    message += `        - Text color (grey or red):\n`;
    
    message += `\n*Delivery info*\n`;
    message += `Full name: \n`;
    message += `Town city:\n`;
    message += `Street address: \n`;
    message += `Any notes for delivery (optional):\n`;
    message += `Any notes for us (optional):\n`;
    message += `Email address (optional):\n`;
    message += `Phone number: \n`;
    
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://api.whatsapp.com/send?phone=${fullNumber}&text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappLink, '_blank');
  };

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1 className={`hero-title ${isMobile ? 'hero-title-mobile' : ''}`}>
            Turn Your Favorite Photos Into Beautiful Albums
          </h1>
          <div className={`hero-subtitle ${isMobile ? 'hero-subtitle-mobile' : ''}`}>
            <p style={{ marginBottom: '0.5rem' }}>You select, upload and submit...</p>
            <p>We print, fill and send you the albums!</p>
          </div>
          <p style={{ marginTop: '1rem', marginBottom: '1.5rem', color: 'var(--pastel-green-dark)', fontWeight: '500', fontSize: '1rem' }}>
            🎉 Free delivery on orders above $90!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="btn btn-primary"
              onClick={() => scrollToSection('album-sections')}
            >
              Start Your Order
            </button>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              width: '100%',
              maxWidth: '300px',
              margin: '0.5rem 0'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
              <span style={{ 
                color: 'var(--text-light)', 
                fontWeight: '500',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleWhatsAppOrder}
              style={{ 
                width: '100%',
                maxWidth: '300px'
              }}
            >
              📱 Complete Order Over WhatsApp
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

