import React, { useState } from 'react';
import './Footer.css';

function Footer() {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  
  // You can use environment variables (VITE_WHATSAPP_NUMBER) or hardcode it here
  const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || 'YOUR_NUMBER';

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const cleanNumber = WHATSAPP_NUMBER.replace(/[\s\-+()]/g, '');
  
  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    
    if (!cleanNumber || cleanNumber === 'YOUR_NUMBER' || cleanNumber.length < 10) {
      alert('WhatsApp number not configured. Please contact us through other means.');
      return false;
    }
    
    // Use api.whatsapp.com format (tested and working)
    const message = encodeURIComponent('Hello! I have a question about your photo album service.');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    return false;
  };

  // Create fallback URL for href (in case JavaScript is disabled)
  const whatsappUrl = cleanNumber && cleanNumber !== 'YOUR_NUMBER' && cleanNumber.length >= 10
    ? `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent('Hello! I have a question about your photo album service.')}`
    : '#';

  return (
    <footer id="contact" className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-contact-info">
            <h3 className="footer-title">Contact Us</h3>
            <div className="contact-details">
              <div className="contact-item">
                <strong>Email:</strong>
                <a href="mailto:traces.leb@gmail.com" className="contact-link">traces.leb@gmail.com</a>
              </div>
              <div className="contact-item">
                <strong>WhatsApp:</strong>
                <a 
                  href={whatsappUrl}
                  className="whatsapp-link"
                  onClick={handleWhatsAppClick}
                >
                  Chat with us on WhatsApp
                </a>
              </div>
            </div>
          </div>
          <div className="footer-legal">
            <p><small>&copy; 2026 Traces. All rights reserved.</small></p>
            <p><small>
              <button className="footer-link-btn" onClick={() => setShowPrivacyPolicy(true)}>Privacy Policy</button>
              {' | '}
              <button className="footer-link-btn" onClick={() => setShowTermsOfService(true)}>Terms of Service</button>
            </small></p>
          </div>
        </div>
      </div>
      
      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="modal-overlay" onClick={() => setShowPrivacyPolicy(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Privacy Policy</h2>
              <button className="modal-close" onClick={() => setShowPrivacyPolicy(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>Last Updated: January 2026</strong></p>
              
              <h3>1. Information We Collect</h3>
              <p>When you place an order through Traces, we collect the following information:</p>
              <ul>
                <li>Personal information: Name, email address, phone number, and delivery address</li>
                <li>Order details: Album preferences, photos, cover customization, and special notes</li>
                <li>Payment information: We process payments through cash on delivery - no payment details are stored</li>
              </ul>
              
              <h3>2. How We Use Your Information</h3>
              <p>We use the information you provide to:</p>
              <ul>
                <li>Process and fulfill your photo album orders</li>
                <li>Communicate with you about your order status via email and WhatsApp</li>
                <li>Deliver your albums to the specified address</li>
                <li>Send order confirmations and updates</li>
                <li>Improve our services and customer experience</li>
              </ul>
              
              <h3>3. Photo Storage and Security</h3>
              <p>Your photos are uploaded securely using Smash API, a trusted file transfer service. Photos are:</p>
              <ul>
                <li>Stored temporarily for order processing</li>
                <li>Used solely for creating your photo albums</li>
                <li>Not shared with third parties except our printing partners</li>
                <li>Deleted after order completion, unless you request otherwise</li>
              </ul>
              
              <h3>4. Data Protection</h3>
              <p>We implement appropriate security measures to protect your personal information and photos. However, no method of transmission over the internet is 100% secure.</p>
              
              <h3>5. Your Rights</h3>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
              
              <h3>6. Contact Us</h3>
              <p>For privacy-related questions or requests, please contact us:</p>
              <ul>
                <li>Email: traces.leb@gmail.com</li>
                <li>WhatsApp: 00961 71 5321 56</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Terms of Service Modal */}
      {showTermsOfService && (
        <div className="modal-overlay" onClick={() => setShowTermsOfService(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Terms of Service</h2>
              <button className="modal-close" onClick={() => setShowTermsOfService(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>Last Updated: January 2026</strong></p>
              
              <h3>1. Acceptance of Terms</h3>
              <p>By using Traces photo album service, you agree to be bound by these Terms of Service. If you do not agree, please do not use our service.</p>
              
              <h3>2. Service Description</h3>
              <p>Traces provides custom photo album printing and delivery services. We offer:</p>
              <ul>
                <li>Photo albums in various sizes (50 or 100 photos)</li>
                <li>Customizable album covers (image or text)</li>
                <li>High-quality A6 size prints</li>
                <li>Delivery to your specified address</li>
              </ul>
              
              <h3>3. Order Process</h3>
              <p>When placing an order:</p>
              <ul>
                <li>You must provide accurate and complete information</li>
                <li>You must own or have permission to use all uploaded photos</li>
                <li>Photos must be in supported formats (JPEG, PNG, WebP, HEIC, HEIF, AVIF)</li>
                <li>You are responsible for ensuring photo quality meets your expectations</li>
              </ul>
              
              <h3>4. Pricing and Payment</h3>
              <p>All prices are displayed in USD. Payment is accepted via cash on delivery only. Prices include:</p>
              <ul>
                <li>Album printing and assembly</li>
                <li>Cover customization</li>
                <li>Delivery within Lebanon</li>
              </ul>
              
              <h3>5. Photo Quality and Content</h3>
              <p>You are responsible for:</p>
              <ul>
                <li>Ensuring photos are of acceptable quality for printing</li>
                <li>Not uploading copyrighted material without permission</li>
                <li>Not uploading inappropriate, illegal, or offensive content</li>
                <li>Respecting the privacy of individuals in your photos</li>
              </ul>
              <p>We reserve the right to refuse orders containing inappropriate content.</p>
              
              <h3>6. Delivery</h3>
              <p>Delivery times vary based on order volume and complexity. We will contact you via WhatsApp or email with delivery updates. You must provide a valid delivery address and be available to receive the order.</p>
              
              <h3>7. Returns and Refunds</h3>
              <p>Due to the custom nature of our products:</p>
              <ul>
                <li>Returns are only accepted for defective or damaged products</li>
                <li>Refunds will be processed within 14 business days</li>
                <li>Customized items cannot be returned unless defective</li>
                <li>Contact us immediately if you receive a damaged product</li>
              </ul>
              
              <h3>8. Intellectual Property</h3>
              <p>You retain all rights to your photos. By uploading photos, you grant Traces a license to use them solely for creating and delivering your order.</p>
              
              <h3>9. Limitation of Liability</h3>
              <p>Traces is not liable for:</p>
              <ul>
                <li>Loss or damage to photos during upload or processing</li>
                <li>Delays in delivery beyond our control</li>
                <li>Quality issues resulting from low-resolution source images</li>
                <li>Loss or damage during delivery (we will replace damaged items)</li>
              </ul>
              
              <h3>10. Contact Information</h3>
              <p>For questions about these terms, contact us:</p>
              <ul>
                <li>Email: traces.leb@gmail.com</li>
                <li>WhatsApp: 00961 71 5321 56</li>
                <li>Website: https://traces-landing-page.vercel.app/</li>
              </ul>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </footer>
  );
}

export default Footer;

