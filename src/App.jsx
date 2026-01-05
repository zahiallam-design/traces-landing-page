import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import AlbumCountSelector from './components/AlbumCountSelector';
import AlbumOptions from './components/AlbumOptions';
import UploadSection from './components/UploadSection';
import CoverCustomization from './components/CoverCustomization';
import OrderForm from './components/OrderForm';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import { sendOrderEmail, sendCustomerConfirmationEmail } from './services/emailService';

function App() {
  const [albumCount, setAlbumCount] = useState(null);
  const [albums, setAlbums] = useState([]); // Array of album objects
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize albums array when count is selected
  const handleAlbumCountSelect = (count) => {
    setAlbumCount(count);
    
    // Preserve existing albums if increasing count, remove extras if decreasing
    if (count > albums.length) {
      // Adding more albums - keep existing ones and add new empty ones
      const newAlbums = Array.from({ length: count - albums.length }, (_, index) => ({
        id: albums.length + index,
        selectedAlbum: null,
        selectedColor: 'green',
        smashTransferUrl: null,
        fileCount: 0,
        cover: null
      }));
      setAlbums([...albums, ...newAlbums]);
    } else if (count < albums.length) {
      // Reducing count - keep only the first N albums
      setAlbums(albums.slice(0, count));
    }
    // If count is same, do nothing (preserve existing data)
  };

  const handleAlbumSelect = (albumIndex, album) => {
    const updatedAlbums = [...albums];
    updatedAlbums[albumIndex].selectedAlbum = album;
    setAlbums(updatedAlbums);
  };

  const handleColorChange = (albumIndex, color) => {
    const updatedAlbums = [...albums];
    updatedAlbums[albumIndex].selectedColor = color;
    setAlbums(updatedAlbums);
  };

  const handleUploadComplete = (albumIndex, transferUrl, count) => {
    const updatedAlbums = [...albums];
    updatedAlbums[albumIndex].smashTransferUrl = transferUrl;
    updatedAlbums[albumIndex].fileCount = count;
    setAlbums(updatedAlbums);
  };

  const handleCoverChange = (albumIndex, coverData) => {
    const updatedAlbums = [...albums];
    updatedAlbums[albumIndex].cover = coverData;
    setAlbums(updatedAlbums);
  };

  const handleOrderSubmit = async (orderData) => {
    // Combine albums data with customer info
    const completeOrderData = {
      ...orderData,
      albums: albums.map(album => ({
        album: {
          size: album.selectedAlbum?.size,
          color: album.selectedColor,
          price: album.selectedAlbum?.price
        },
        smashTransferUrl: album.smashTransferUrl,
        fileCount: album.fileCount,
        cover: album.cover
      })),
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
    let albumsText = '';
    orderData.albums.forEach((albumData, index) => {
      const coverInfo = albumData.cover?.type === 'image' 
        ? (albumData.cover.imageUrl ? `Image cover - URL: ${albumData.cover.imageUrl}` : 'Image cover')
        : albumData.cover?.type === 'text' 
          ? `Text: "${albumData.cover.title}"${albumData.cover.date ? ` - ${albumData.cover.date}` : ''}`
          : 'Not selected';
      
      albumsText += `
ALBUM ${index + 1}:
- Size: ${albumData.album.size} Photos
- Color: ${albumData.album.color.charAt(0).toUpperCase() + albumData.album.color.slice(1)}
- Price: $${albumData.album.price.toFixed(2)}
- Photos: ${albumData.fileCount} photos
- Transfer URL: ${albumData.smashTransferUrl}
- Cover: ${coverInfo}
`;
    });

    const total = orderData.albums.reduce((sum, album) => sum + album.album.price, 0);

    return `
NEW ALBUM ORDER
================

NUMBER OF ALBUMS: ${orderData.albums.length}

${albumsText}
CUSTOMER DETAILS:
- Name: ${orderData.customer.fullName}
- Email: ${orderData.customer.email || 'Not provided'}
- Address: ${orderData.customer.deliveryAddress}
- Mobile: ${orderData.customer.mobileNumber}

DELIVERY NOTES:
${orderData.notes || 'None'}

TOTAL: $${total.toFixed(2)}

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
      <p style="margin-bottom: 1rem;">We've received your order and will process it soon.${orderData.customer.email ? ' Check your email for order confirmation.' : ''}</p>
      <div id="order-summary-content" style="background-color: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-family: monospace; font-size: 0.9rem; white-space: pre-wrap;">${orderText}</div>
      <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
        <button id="print-order" style="background-color: #4a90e2; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-size: 1rem; flex: 1;">Print Order Summary</button>
        <button id="close-modal" style="background-color: var(--pastel-green-dark); color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-size: 1rem; flex: 1;">Close</button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Print handler
    const printBtn = modalContent.querySelector('#print-order');
    printBtn.addEventListener('click', () => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Order Summary - ${orderData.customer.fullName}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 2rem;
                max-width: 800px;
                margin: 0 auto;
              }
              h1 {
                color: #2d8659;
                margin-bottom: 1rem;
              }
              .order-details {
                background-color: #f5f5f5;
                padding: 1.5rem;
                border-radius: 8px;
                font-family: monospace;
                font-size: 0.9rem;
                white-space: pre-wrap;
                margin: 1rem 0;
              }
              @media print {
                body {
                  padding: 1rem;
                }
              }
            </style>
          </head>
          <body>
            <h1>Order Summary</h1>
            <p><strong>Customer:</strong> ${orderData.customer.fullName}</p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
            <div class="order-details">${orderText}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    });
    
    // Close modal handlers
    const closeModal = () => {
      document.body.removeChild(modal);
      // Scroll to top before refresh
      window.scrollTo(0, 0);
      // Refresh the page to reset the form
      window.location.reload();
    };
    
    const closeBtn = modalContent.querySelector('#close-modal');
    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
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
      
      <AlbumCountSelector onCountSelect={handleAlbumCountSelect} currentCount={albumCount} />
      {albumCount && (
        <>
          <div id="album-sections" style={{ marginTop: '2rem' }}>
            {albums.map((album, index) => (
              <div key={album.id} className="album-section-wrapper" style={{ marginBottom: '4rem', paddingBottom: '2rem', borderBottom: index < albums.length - 1 ? '2px solid var(--border-light)' : 'none' }}>
                <AlbumOptions
                  albumIndex={index}
                  selectedAlbum={album.selectedAlbum}
                  onAlbumSelect={(albumData) => handleAlbumSelect(index, albumData)}
                  selectedColor={album.selectedColor}
                  onColorChange={(color) => handleColorChange(index, color)}
                />
                <UploadSection
                  albumIndex={index}
                  selectedAlbum={album.selectedAlbum}
                  onUploadComplete={(transferUrl, count) => handleUploadComplete(index, transferUrl, count)}
                />
                {album.smashTransferUrl && (
                  <CoverCustomization
                    albumIndex={index}
                    onCoverChange={(coverData) => handleCoverChange(index, coverData)}
                  />
                )}
              </div>
            ))}
          </div>
          
          <OrderForm
            albums={albums}
            deliveryNotes={notes}
            onDeliveryNotesChange={setNotes}
            onSubmit={handleOrderSubmit}
            isSubmitting={isSubmitting}
          />
        </>
      )}
      
      <Gallery />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 2rem', backgroundColor: 'transparent' }}>
        <img 
          src="/logo.jpeg" 
          alt="Traces Logo" 
          style={{ 
            maxWidth: '300px', 
            width: '100%', 
            height: 'auto',
            objectFit: 'contain'
          }} 
        />
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default App;

