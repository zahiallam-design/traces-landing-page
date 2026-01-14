import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import AlbumOptions from './components/AlbumOptions';
import UploadSection from './components/UploadSection';
import CoverCustomization from './components/CoverCustomization';
import OrderForm from './components/OrderForm';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import { sendOrderEmail, sendCustomerConfirmationEmail } from './services/emailService';

// Generate unique order number based on timestamp
// Uses Unix timestamp in milliseconds - a single number that's always increasing
const generateOrderNumber = () => {
  return Date.now().toString();
};

function App() {
  const [albums, setAlbums] = useState([]); // Array of album objects
  const [notes, setNotes] = useState('');
  const [notesForUs, setNotesForUs] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null); // Generate order number early for file naming
  const [validationErrors, setValidationErrors] = useState({}); // Track validation errors per album
  const [albumUploadStates, setAlbumUploadStates] = useState({}); // Track upload state per album
  const [albumFilesSelected, setAlbumFilesSelected] = useState({}); // Track if files are selected per album
  const [albumUploadProgress, setAlbumUploadProgress] = useState({}); // Track upload progress per album: { albumIndex: { current, total } }

  const MAX_ALBUMS = 3;

  // Generate unique album ID
  const generateAlbumId = () => {
    return `album-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Initialize with 1 album on mount
  useEffect(() => {
    if (albums.length === 0) {
      // Generate order number on mount
      const newOrderNumber = generateOrderNumber();
      setOrderNumber(newOrderNumber);
      
      // Initialize with 1 album
      setAlbums([{
        id: generateAlbumId(),
        selectedAlbum: null,
        selectedColor: null,
        smashTransferUrl: null,
        fileCount: 0,
        cover: null
      }]);
    }
    // Only run on mount - don't re-run if albums array changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a new album
  const handleAddAlbum = () => {
    setAlbums(prevAlbums => {
      if (prevAlbums.length >= MAX_ALBUMS) {
        return prevAlbums; // Don't allow more than MAX_ALBUMS
      }
      
      const newAlbum = {
        id: generateAlbumId(),
        selectedAlbum: null,
        selectedColor: null,
        smashTransferUrl: null,
        fileCount: 0,
        cover: null
      };
      
      const newAlbums = [...prevAlbums, newAlbum];
      
      // Scroll to the new album section after state update
      setTimeout(() => {
        const newAlbumIndex = newAlbums.length - 1;
        const newAlbumElement = document.getElementById(`album-section-${newAlbumIndex}`);
        if (newAlbumElement) {
          newAlbumElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      return newAlbums;
    });
  };

  // Remove a specific album
  const handleRemoveAlbum = (albumIndex) => {
    // Check if this album is currently uploading
    if (albumUploadStates[albumIndex]) {
      return; // Don't allow removal during upload
    }
    
    setAlbums(prevAlbums => {
      // Don't allow removing if only 1 album remains
      if (prevAlbums.length <= 1) {
        return prevAlbums;
      }
      
      // Remove the album and update indices
      const updatedAlbums = prevAlbums.filter((_, index) => index !== albumIndex);
      
      // Clean up upload states for removed album and reindex remaining ones
      setAlbumUploadStates(prevStates => {
        const updatedUploadStates = {};
        updatedAlbums.forEach((_, newIndex) => {
          // Find the old index for this album
          if (newIndex < albumIndex) {
            // Albums before removed one keep their state
            if (prevStates[newIndex] !== undefined) {
              updatedUploadStates[newIndex] = prevStates[newIndex];
            }
          } else {
            // Albums after removed one shift their state
            const oldIndex = newIndex + 1;
            if (prevStates[oldIndex] !== undefined) {
              updatedUploadStates[newIndex] = prevStates[oldIndex];
            }
          }
        });
        return updatedUploadStates;
      });
      
      setAlbumFilesSelected(prevSelected => {
        const updatedFilesSelected = {};
        updatedAlbums.forEach((_, newIndex) => {
          // Find the old index for this album
          if (newIndex < albumIndex) {
            // Albums before removed one keep their state
            if (prevSelected[newIndex] !== undefined) {
              updatedFilesSelected[newIndex] = prevSelected[newIndex];
            }
          } else {
            // Albums after removed one shift their state
            const oldIndex = newIndex + 1;
            if (prevSelected[oldIndex] !== undefined) {
              updatedFilesSelected[newIndex] = prevSelected[oldIndex];
            }
          }
        });
        return updatedFilesSelected;
      });
      
      // Clean up validation errors for removed album and reindex
      setValidationErrors(prevErrors => {
        const updatedErrors = {};
        Object.keys(prevErrors).forEach(key => {
          const match = key.match(/album-(\d+)-(.+)/);
          if (match) {
            const oldIndex = parseInt(match[1]);
            if (oldIndex < albumIndex) {
              // Keep errors for albums before removed one
              updatedErrors[key] = prevErrors[key];
            } else if (oldIndex > albumIndex) {
              // Shift errors for albums after removed one
              updatedErrors[`album-${oldIndex - 1}-${match[2]}`] = prevErrors[key];
            }
            // Skip errors for the removed album
          } else {
            // Keep non-album errors
            updatedErrors[key] = prevErrors[key];
          }
        });
        return updatedErrors;
      });
      
      return updatedAlbums;
    });
  };

  const handleAlbumSelect = (albumIndex, album) => {
    setAlbums(prevAlbums => {
      const updatedAlbums = [...prevAlbums];
      if (updatedAlbums[albumIndex]) {
        updatedAlbums[albumIndex] = { ...updatedAlbums[albumIndex], selectedAlbum: album };
      }
      return updatedAlbums;
    });
  };

  const handleColorChange = (albumIndex, color) => {
    setAlbums(prevAlbums => {
      const updatedAlbums = [...prevAlbums];
      if (updatedAlbums[albumIndex]) {
        updatedAlbums[albumIndex] = { ...updatedAlbums[albumIndex], selectedColor: color };
      }
      return updatedAlbums;
    });
  };

  const handleUploadComplete = (albumIndex, transferUrl, count) => {
    setAlbums(prevAlbums => {
      const updatedAlbums = [...prevAlbums];
      if (updatedAlbums[albumIndex]) {
        updatedAlbums[albumIndex] = { 
          ...updatedAlbums[albumIndex], 
          smashTransferUrl: transferUrl,
          fileCount: count
        };
      }
      return updatedAlbums;
    });
  };

  const handleCoverChange = (albumIndex, coverData) => {
    setAlbums(prevAlbums => {
      const updatedAlbums = [...prevAlbums];
      if (updatedAlbums[albumIndex]) {
        updatedAlbums[albumIndex] = { ...updatedAlbums[albumIndex], cover: coverData };
      }
      return updatedAlbums;
    });
  };

  const handleOrderSubmit = async (orderData) => {
    // Use existing order number (generated on mount)
    // If for some reason it doesn't exist, generate a new one
    const finalOrderNumber = orderNumber || generateOrderNumber();
    
    // Combine albums data with customer info
    // IMPORTANT: Include ALL albums in the order - don't filter
    const completeOrderData = {
      ...orderData,
      orderNumber: finalOrderNumber,
      timestamp: new Date().toISOString(),
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
      notes,
      notesForUs
    };
    
    setIsSubmitting(true);
    
    let ownerEmailSent = false;
    let customerEmailSent = false;
    let emailError = null;
    
    try {
      // Send email to business owner
      await sendOrderEmail(completeOrderData);
      ownerEmailSent = true;
      
      // Send confirmation email to customer (if email provided)
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
        ? 'Image cover'
        : albumData.cover?.type === 'text' 
          ? `Text: "${albumData.cover.title}" (${albumData.cover.color === 'grey' ? 'Grey' : albumData.cover.color === 'red' ? 'Red' : 'Unknown'})`
          : 'Not selected';
      
      albumsText += `
ALBUM ${index + 1}:
- Size: ${albumData.album.size} Photos
- Color: ${albumData.album.color.charAt(0).toUpperCase() + albumData.album.color.slice(1)}
- Price: $${albumData.album.price.toFixed(2)}
- Photos: ${albumData.fileCount} photos
- Cover: ${coverInfo}
`;
    });

    const subtotal = orderData.albums.reduce((sum, album) => sum + album.album.price, 0);
    const deliveryCharge = subtotal >= 90 ? 0 : 4; // Free delivery on orders above $90
    const total = subtotal + deliveryCharge;

    return `
NEW ALBUM ORDER
================

ORDER NUMBER: ${orderData.orderNumber || 'N/A'}

NUMBER OF ALBUMS: ${orderData.albums.length}

${albumsText}
CUSTOMER DETAILS:
- Name: ${orderData.customer.fullName}
- Email: ${orderData.customer.email || 'Not provided'}
- Town/City: ${orderData.customer.deliveryTown || 'Not provided'}
- Address: ${orderData.customer.deliveryAddress}
- Mobile: ${orderData.customer.mobileNumber}

DELIVERY NOTES:
${orderData.notes || 'None'}

${orderData.notesForUs ? `NOTES FOR US:\n${orderData.notesForUs}\n\n` : ''}SUBTOTAL: $${subtotal.toFixed(2)}
DELIVERY CHARGE: $${deliveryCharge.toFixed(2)}
TOTAL: $${total.toFixed(2)}

Order Date: ${orderData.timestamp ? new Date(orderData.timestamp).toLocaleString() : new Date().toLocaleString()}

DELIVERY TIME: Your order will be delivered to your doorstep within 3 to 5 business days.
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
      emailStatusHtml = '<p style="color: var(--pastel-green-dark); margin-bottom: 1rem;">✓ Order confirmation email sent to your inbox!<br/><small style="color: var(--text-light); font-size: 0.85rem;">Please check your junk/spam folder if you don\'t see it.</small></p>';
    } else if (ownerEmailSent && orderData.customer.email) {
      emailStatusHtml = '<p style="color: var(--pastel-green-dark); margin-bottom: 1rem;">✓ Order received! Check your email for confirmation.<br/><small style="color: var(--text-light); font-size: 0.85rem;">Please check your junk/spam folder if you don\'t see it.</small></p>';
    } else if (ownerEmailSent && !orderData.customer.email) {
      emailStatusHtml = '<p style="color: var(--pastel-green-dark); margin-bottom: 1rem;">✓ Order received! You will receive a WhatsApp message for confirmation.</p>';
    } else if (emailError) {
      emailStatusHtml = `<p style="color: #c33; margin-bottom: 1rem;">⚠ Email could not be sent: ${emailError}<br/>Your order has been logged and we will contact you via WhatsApp.</p>`;
    }
    
    modalContent.innerHTML = `
      <h2 style="color: var(--pastel-green-dark); margin-bottom: 1rem;">Order Submitted Successfully!</h2>
      <p style="margin-bottom: 1rem;">Thank you for your order, ${orderData.customer.fullName}!</p>
      ${emailStatusHtml}
      <p style="margin-bottom: 1rem;">We've received your order and will process it soon.${orderData.customer.email ? ' Check your email for order confirmation.' : ' You will receive a WhatsApp message for confirmation.'}</p>
      <div id="order-summary-content" style="background-color: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-family: monospace; font-size: 0.9rem; white-space: pre-wrap;">${orderText}</div>
      <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
        <button id="download-pdf" style="background-color: #4a90e2; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-size: 1rem; flex: 1;">Download Order Summary</button>
        <button id="close-modal" style="background-color: var(--pastel-green-dark); color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-size: 1rem; flex: 1;">Close</button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // PDF Download handler
    const downloadBtn = modalContent.querySelector('#download-pdf');
    downloadBtn.addEventListener('click', () => {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;
      
      // Helper function to add text with word wrap
      const addText = (text, fontSize = 12, isBold = false, color = [0, 0, 0]) => {
        pdf.setFontSize(fontSize);
        pdf.setTextColor(color[0], color[1], color[2]);
        if (isBold) {
          pdf.setFont(undefined, 'bold');
        } else {
          pdf.setFont(undefined, 'normal');
        }
        
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        lines.forEach((line) => {
          if (yPosition > pageHeight - margin - 10) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        yPosition += 5;
      };
      
      // Traces Branding Header
      addText('TRACES', 24, true, [45, 134, 89]);
      addText('Hold Your Moments!', 12, false, [100, 100, 100]);
      yPosition += 10;
      
      // Title
      addText('ORDER SUMMARY', 18, true, [45, 134, 89]);
      yPosition += 5;
      
      // Order Number
      addText(`Order Number: ${orderData.orderNumber || 'N/A'}`, 14, true);
      yPosition += 5;
      
      // Customer Info
      addText(`Customer: ${orderData.customer.fullName}`, 12, true);
      addText(`Order Date: ${orderData.timestamp ? new Date(orderData.timestamp).toLocaleString() : new Date().toLocaleString()}`, 10);
      yPosition += 5;
      
      // Order Details
      addText('ORDER DETAILS:', 12, true);
      orderData.albums.forEach((albumData, index) => {
        const coverInfo = albumData.cover?.type === 'image' 
          ? 'Image cover'
          : albumData.cover?.type === 'text' 
            ? `Text: "${albumData.cover.title}" (${albumData.cover.color === 'grey' ? 'Grey' : albumData.cover.color === 'red' ? 'Red' : 'Unknown'})`
            : 'Not selected';
        
        addText(`Album ${index + 1}:`, 11, true);
        addText(`  Size: ${albumData.album.size} Photos`, 10);
        addText(`  Color: ${albumData.album.color.charAt(0).toUpperCase() + albumData.album.color.slice(1)}`, 10);
        addText(`  Price: $${albumData.album.price.toFixed(2)}`, 10);
        addText(`  Photos: ${albumData.fileCount} photos`, 10);
        addText(`  Cover: ${coverInfo}`, 10);
        yPosition += 3;
      });
      
      yPosition += 5;
      
      // Customer Details
      addText('CUSTOMER DETAILS:', 12, true);
      addText(`Name: ${orderData.customer.fullName}`, 10);
      addText(`Email: ${orderData.customer.email || 'Not provided'}`, 10);
      addText(`Town/City: ${orderData.customer.deliveryTown || 'Not provided'}`, 10);
      addText(`Address: ${orderData.customer.deliveryAddress}`, 10);
      addText(`Mobile: ${orderData.customer.mobileNumber}`, 10);
      
      if (orderData.notes) {
        yPosition += 5;
        addText('DELIVERY NOTES:', 12, true);
        addText(orderData.notes, 10);
      }
      
      if (orderData.notesForUs) {
        yPosition += 5;
        addText('NOTES FOR US:', 12, true);
        addText(orderData.notesForUs, 10);
      }
      
      yPosition += 5;
      const subtotal = orderData.albums.reduce((sum, album) => sum + album.album.price, 0);
      const deliveryCharge = subtotal >= 90 ? 0 : 4; // Free delivery on orders above $90
      const total = subtotal + deliveryCharge;
      addText(`SUBTOTAL: $${subtotal.toFixed(2)}`, 10);
      addText(`DELIVERY CHARGE: $${deliveryCharge.toFixed(2)}`, 10);
      addText(`TOTAL: $${total.toFixed(2)}`, 14, true, [45, 134, 89]);
      
      yPosition += 10;
      addText('DELIVERY TIME:', 12, true, [45, 134, 89]);
      addText('Your order will be delivered to your doorstep within 3 to 5 business days.', 10);
      
      // Contact Information Footer
      yPosition += 15;
      // Use regular dashes instead of Unicode characters to avoid rendering issues
      addText('------------------------------------------------', 10, false, [200, 200, 200]);
      yPosition += 5;
      addText('CONTACT INFORMATION', 12, true, [45, 134, 89]);
      yPosition += 3;
      addText('Traces', 11, true);
      
      addText('Email: traces.leb@gmail.com', 10);
      addText('WhatsApp: 00961 71 5321 56', 10);
      addText('Website: https://traces-leb.vercel.app/', 10);
      
      // Download PDF
      const fileName = `Order_Summary_${orderData.orderNumber || 'N/A'}.pdf`;
      pdf.save(fileName);
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
      
      {albums.length > 0 && (
        <>
          <div id="album-sections" style={{ marginTop: '2rem' }}>
            {albums.map((album, index) => (
              <div key={album.id} id={`album-section-${index}`} className="album-section-wrapper" style={{ marginBottom: '4rem', paddingBottom: '2rem', borderBottom: index < albums.length - 1 ? '2px solid var(--border-light)' : 'none' }}>
                <AlbumOptions
                  albumIndex={index}
                  selectedAlbum={album.selectedAlbum}
                  onAlbumSelect={(albumData) => {
                    handleAlbumSelect(index, albumData);
                    // Clear validation error when album is selected
                    if (validationErrors[`album-${index}-size`]) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[`album-${index}-size`];
                        return newErrors;
                      });
                    }
                  }}
                  selectedColor={album.selectedColor}
                  onColorChange={(color) => {
                    handleColorChange(index, color);
                    // Clear validation error when color is selected
                    if (validationErrors[`album-${index}-color`]) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[`album-${index}-color`];
                        return newErrors;
                      });
                    }
                  }}
                  hasError={validationErrors[`album-${index}-size`] || validationErrors[`album-${index}-color`]}
                  onRemoveAlbum={handleRemoveAlbum}
                  canRemoveAlbum={albums.length > 1}
                  isUploading={albumUploadStates[index]}
                />
                {album.selectedAlbum && album.selectedColor && (
                  <UploadSection
                    albumIndex={index}
                    selectedAlbum={album.selectedAlbum}
                    orderNumber={orderNumber}
                    onUploadComplete={(transferUrl, count) => {
                      handleUploadComplete(index, transferUrl, count);
                      // Clear validation error when photos are uploaded
                      if (validationErrors[`album-${index}-photos`]) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[`album-${index}-photos`];
                          return newErrors;
                        });
                      }
                    }}
                    hasError={validationErrors[`album-${index}-photos`]}
                    onUploadStateChange={(isInProgress) => {
                      // Track upload state per album
                      setAlbumUploadStates(prev => ({
                        ...prev,
                        [index]: isInProgress
                      }));
                    }}
                    onFilesSelected={(hasFiles) => {
                      // Track if files are selected per album
                      setAlbumFilesSelected(prev => ({
                        ...prev,
                        [index]: hasFiles
                      }));
                    }}
                    onUploadProgress={(albumIdx, current, total) => {
                      // Track upload progress per album
                      setAlbumUploadProgress(prev => ({
                        ...prev,
                        [albumIdx]: { current, total }
                      }));
                    }}
                  />
                )}
                {(album.smashTransferUrl || albumUploadStates[index]) && (
                  <>
                    <CoverCustomization
                      albumIndex={index}
                      onCoverChange={(coverData) => {
                        handleCoverChange(index, coverData);
                        // Clear validation error when cover is set
                        if (validationErrors[`album-${index}-cover`]) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`album-${index}-cover`];
                            return newErrors;
                          });
                        }
                      }}
                      hasError={validationErrors[`album-${index}-cover`]}
                    />
                    {/* Add Album button after cover customization */}
                    {index === albums.length - 1 && albums.length < MAX_ALBUMS && (
                      <div style={{ 
                        textAlign: 'center', 
                        marginTop: '3rem', 
                        marginBottom: '2rem',
                        padding: '2rem',
                        backgroundColor: 'var(--bg-light)',
                        borderRadius: '12px'
                      }}>
                        <button
                          onClick={handleAddAlbum}
                          style={{
                            backgroundColor: 'var(--pastel-green-dark)',
                            color: 'white',
                            border: 'none',
                            padding: '1rem 2.5rem',
                            borderRadius: '8px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--pastel-green)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--pastel-green-dark)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          + Add Another Album
                        </button>
                      </div>
                    )}
                    {/* WhatsApp contact message after 3rd album */}
                    {index === albums.length - 1 && albums.length >= MAX_ALBUMS && (
                      <div style={{ 
                        textAlign: 'center', 
                        marginTop: '3rem', 
                        marginBottom: '2rem',
                        padding: '2rem',
                        backgroundColor: 'var(--pastel-green-light)',
                        borderRadius: '12px',
                        border: '2px solid var(--pastel-green-dark)'
                      }}>
                        <p style={{ 
                          fontSize: '1.1rem', 
                          color: 'var(--text-dark)',
                          margin: '0 0 1rem 0',
                          fontWeight: '500'
                        }}>
                          Want to order more than {MAX_ALBUMS} albums?
                        </p>
                        <p style={{ 
                          fontSize: '1rem', 
                          color: 'var(--text-light)',
                          margin: '0'
                        }}>
                          Please contact us directly through WhatsApp
                        </p>
                        <a
                          href="https://api.whatsapp.com/send?phone=96171532156"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'var(--pastel-green-dark)',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--pastel-green)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--pastel-green-dark)';
                          }}
                        >
                          Contact Us on WhatsApp
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          
          <OrderForm
            albums={albums}
            deliveryNotes={notes}
            onDeliveryNotesChange={setNotes}
            notesForUs={notesForUs}
            onNotesForUsChange={setNotesForUs}
            onSubmit={handleOrderSubmit}
            isSubmitting={isSubmitting}
            onValidationError={setValidationErrors}
            isUploadInProgress={Object.values(albumUploadStates).some(state => state === true)}
            albumUploadProgress={albumUploadProgress}
          />
        </>
      )}
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default App;

