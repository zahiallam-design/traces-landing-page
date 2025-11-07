import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import AlbumOptions from './components/AlbumOptions';
import UploadSection from './components/UploadSection';
import OrderForm from './components/OrderForm';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import { initEmailJS, sendOrderEmail, sendCustomerConfirmationEmail } from './services/emailService';

function App() {
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedColor, setSelectedColor] = useState('green');
  const [smashTransferUrl, setSmashTransferUrl] = useState(null);
  const [fileCount, setFileCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [giftWrap, setGiftWrap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize EmailJS when app loads
  useEffect(() => {
    initEmailJS();
  }, []);

  const handleAlbumSelect = (album) => {
    setSelectedAlbum(album);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  const handleUploadComplete = (transferUrl, count) => {
    setSmashTransferUrl(transferUrl);
    setFileCount(count);
  };

  const handleOrderSubmit = async (orderData) => {
    // Add notes to order data
    const completeOrderData = {
      ...orderData,
      notes
    };
    
    setIsSubmitting(true);
    
    let ownerEmailSent = false;
    let customerEmailSent = false;
    let emailError = null;
    
    try {
      // Send email to business owner
      await sendOrderEmail(completeOrderData);
      ownerEmailSent = true;
      
      // Send confirmation email to customer
      const customerEmailResult = await sendCustomerConfirmationEmail(completeOrderData);
      customerEmailSent = customerEmailResult.success;
      
      // Format order data for display
      const orderText = formatOrderForEmail(completeOrderData);
      
      // Log order data (for debugging)
      console.log('Order submitted:', completeOrderData);
      
      // Show success message
      showSuccessMessage(completeOrderData, orderText, ownerEmailSent, customerEmailSent, emailError);
      
    } catch (error) {
      console.error('Failed to send order email:', error);
      emailError = error.message;
      
      // Try to send customer email even if owner email failed
      try {
        const customerEmailResult = await sendCustomerConfirmationEmail(completeOrderData);
        customerEmailSent = customerEmailResult.success;
      } catch (customerError) {
        console.error('Failed to send customer email:', customerError);
      }
      
      // Format order data for display even if email fails
      const orderText = formatOrderForEmail(completeOrderData);
      
      // Show success message but with email error warning
      showSuccessMessage(completeOrderData, orderText, ownerEmailSent, customerEmailSent, emailError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatOrderForEmail = (orderData) => {
    return `
NEW ALBUM ORDER
================

ALBUM DETAILS:
- Size: ${orderData.album.size} Photos
- Color: ${orderData.album.color}
- Price: $${orderData.album.price.toFixed(2)}

CUSTOMER DETAILS:
- Name: ${orderData.customer.fullName}
- Email: ${orderData.customer.email || 'Not provided'}
- Address: ${orderData.customer.deliveryAddress}
- Mobile: ${orderData.customer.mobileNumber}

PHOTOS:
- Smash Transfer URL: ${orderData.smashTransferUrl}
- Number of Photos: ${orderData.fileCount}

EXTRAS:
- Gift Wrap: ${orderData.giftWrap ? 'Yes' : 'No'}
- Notes: ${orderData.notes || 'None'}

TOTAL: $${orderData.total.toFixed(2)}

Order Date: ${new Date(orderData.timestamp).toLocaleString()}
    `.trim();
  };

  const showSuccessMessage = (orderData, orderText, ownerEmailSent = false, customerEmailSent = false, emailError = null) => {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background-color: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    let emailStatusHtml = '';
    
    if (ownerEmailSent && customerEmailSent) {
      emailStatusHtml = '<p style="color: var(--pastel-green-dark); margin-bottom: 1rem;">✓ Order confirmation email sent to your inbox!</p>';
    } else if (ownerEmailSent) {
      emailStatusHtml = '<p style="color: var(--pastel-green-dark); margin-bottom: 1rem;">✓ Order received! Check your email for confirmation.</p>';
    } else if (emailError) {
      emailStatusHtml = `<p style="color: #c33; margin-bottom: 1rem;">⚠ Email could not be sent: ${emailError}<br/>Your order has been logged and we will contact you via WhatsApp.</p>`;
    }
    
    modalContent.innerHTML = `
      <h2 style="color: var(--pastel-green-dark); margin-bottom: 1rem;">Order Submitted Successfully!</h2>
      <p style="margin-bottom: 1rem;">Thank you for your order, ${orderData.customer.fullName}!</p>
      ${emailStatusHtml}
      <p style="margin-bottom: 1rem;">We've received your order and will process it soon.${orderData.customer.email ? ' Check your email for order confirmation.' : ''} You'll also receive updates via WhatsApp.</p>
      <div style="background-color: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-family: monospace; font-size: 0.9rem; white-space: pre-wrap;">${orderText}</div>
      <button id="close-modal" style="background-color: var(--pastel-green-dark); color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-size: 1rem; width: 100%;">Close</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal handlers
    const closeBtn = modalContent.querySelector('#close-modal');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // Copy order text to clipboard
    navigator.clipboard.writeText(orderText).then(() => {
      console.log('Order details copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  };

  return (
    <div className="App">
      <Header />
      <Hero />
      <HowItWorks />
      <AlbumOptions
        selectedAlbum={selectedAlbum}
        onAlbumSelect={handleAlbumSelect}
        selectedColor={selectedColor}
        onColorChange={handleColorChange}
      />
      <UploadSection
        selectedAlbum={selectedAlbum}
        onUploadComplete={handleUploadComplete}
      />
      <OrderForm
        selectedAlbum={selectedAlbum}
        selectedColor={selectedColor}
        giftWrap={giftWrap}
        onGiftWrapChange={setGiftWrap}
        deliveryNotes={notes}
        onDeliveryNotesChange={setNotes}
        smashTransferUrl={smashTransferUrl}
        fileCount={fileCount}
        onSubmit={handleOrderSubmit}
        isSubmitting={isSubmitting}
      />
      <Gallery />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default App;

