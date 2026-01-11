import React, { useState } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './OrderForm.css';

function OrderForm({ 
  albums,
  deliveryNotes,
  onDeliveryNotesChange,
  notesForUs,
  onNotesForUsChange,
  onSubmit,
  isSubmitting = false,
  onValidationError
}) {
  const breakpoint = useBreakpoint();
  const isMobile = ['xs', 'ss', 'sm'].includes(breakpoint);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    deliveryAddress: '',
    mobileNumber: ''
  });

  const subtotal = albums.reduce((sum, album) => {
    return sum + (album.selectedAlbum?.price || 0);
  }, 0);
  const deliveryCharge = 4;
  const total = subtotal + deliveryCharge;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return; // Prevent double submission
    }
    
    // Validate all albums are complete
    const errors = {};
    let firstErrorSection = null;
    
    for (let i = 0; i < albums.length; i++) {
      const album = albums[i];
      if (!album.selectedAlbum) {
        errors[`album-${i}-size`] = `Please select an album size for Album ${i + 1}`;
        if (!firstErrorSection) firstErrorSection = `album-options-${i}`;
      } else if (!album.selectedColor) {
        errors[`album-${i}-color`] = `Please select a color for Album ${i + 1}`;
        if (!firstErrorSection) firstErrorSection = `color-selection-${i}`;
      } else if (!album.smashTransferUrl) {
        errors[`album-${i}-photos`] = `Please upload photos for Album ${i + 1}`;
        if (!firstErrorSection) firstErrorSection = `upload-photos-${i}`;
      } else if (!album.cover) {
        errors[`album-${i}-cover`] = `Please customize the cover for Album ${i + 1}`;
        if (!firstErrorSection) firstErrorSection = `cover-customization-${i}`;
      }
    }
    
    if (Object.keys(errors).length > 0) {
      if (onValidationError) {
        onValidationError(errors);
      }
      // Scroll to first error section
      if (firstErrorSection) {
        setTimeout(() => {
          const element = document.getElementById(firstErrorSection);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      return;
    }

    const orderData = {
      customer: formData,
      notes: deliveryNotes,
      total,
      timestamp: new Date().toISOString()
    };

    onSubmit(orderData);
  };

  return (
    <section id="order-form" className="order-section">
      <div className="container">
        <h2 className="section-title">Complete Your Order</h2>
        <div className={`order-content ${isMobile ? 'order-content-mobile' : ''}`}>
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-item">
              <span>Number of Albums:</span>
              <span>{albums.length}</span>
            </div>
            {albums.map((album, index) => (
              <div key={index} className="album-summary-item">
                <div className="summary-item">
                  <span>Album {index + 1}:</span>
                  <span>{album.selectedAlbum ? `${album.selectedAlbum.size} Photos` : 'Not selected'}</span>
                </div>
                <div className="summary-item">
                  <span>Color:</span>
                  <span>{album.selectedAlbum ? album.selectedColor.charAt(0).toUpperCase() + album.selectedColor.slice(1) : '-'}</span>
                </div>
                <div className="summary-item">
                  <span>Price:</span>
                  <span>${album.selectedAlbum?.price.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            ))}
            <div className="summary-item">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span>Delivery Charge:</span>
              <span>${deliveryCharge.toFixed(2)}</span>
            </div>
            <div className="summary-total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="summary-delivery-info" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--pastel-green-light)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
              <strong>Delivery Time:</strong> Your order will be delivered to your doorstep within 3 to 5 business days.
            </div>
          </div>
          <form className="order-form-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="full-name">Full Name *</label>
              <input
                type="text"
                id="full-name"
                name="full-name"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="delivery-address">Delivery Address *</label>
              <textarea
                id="delivery-address"
                name="delivery-address"
                rows="3"
                required
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="delivery-notes">Delivery Notes (Optional)</label>
              <textarea
                id="delivery-notes"
                name="delivery-notes"
                rows="3"
                placeholder="Any special instructions for delivery..."
                value={deliveryNotes}
                onChange={(e) => onDeliveryNotesChange(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="notes-for-us">Notes for Us (Optional)</label>
              <textarea
                id="notes-for-us"
                name="notes-for-us"
                rows="3"
                placeholder="Any special notes for us..."
                value={notesForUs || ''}
                onChange={(e) => onNotesForUsChange(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address (Optional)</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
              />
              <small style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                If provided, we'll send you an order confirmation email
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="mobile-number">Mobile Number *</label>
              <input
                type="tel"
                id="mobile-number"
                name="mobile-number"
                required
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
              />
            </div>
            <div className="form-disclaimer">
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                <li>Your personal photos will be permanently deleted once your album is printed and delivered.</li>
                <li>You will receive a confirmation message once your order is placed on your WhatsApp number{formData.email ? ' and email' : ''}.</li>
              </ul>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary btn-large"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting Order...' : 'Place Order – Pay on Delivery'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default OrderForm;

