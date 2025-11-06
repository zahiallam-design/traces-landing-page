import React from 'react';
import './Footer.css';

function Footer() {
  // You can use environment variables (VITE_WHATSAPP_NUMBER) or hardcode it here
  const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || 'YOUR_NUMBER';

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer id="contact" className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-links">
            <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button onClick={() => scrollToSection('contact')}>Contact</button>
          </div>
          <div className="footer-contact">
            <p>Questions? Chat with us on WhatsApp</p>
            <a 
              href="#" 
              className="whatsapp-link"
              onClick={(e) => {
                e.preventDefault();
                const cleanNumber = WHATSAPP_NUMBER.replace(/[\s\-+()]/g, '');
                
                if (!cleanNumber || cleanNumber === 'YOUR_NUMBER' || cleanNumber.length < 10) {
                  alert('WhatsApp number not configured. Please contact us through other means.');
                  return false;
                }
                
                // Use api.whatsapp.com format (tested and working)
                // Format: https://api.whatsapp.com/send?phone=[number]&text=[message]
                const message = encodeURIComponent('Hello! I have a question about your photo album service.');
                const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${message}`;
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                return false;
              }}
            >
              WhatsApp Support
            </a>
          </div>
          <div className="footer-legal">
            <p><small>&copy; 2024 Your Albums. All rights reserved.</small></p>
            <p><small>Privacy Policy | Terms of Service</small></p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

