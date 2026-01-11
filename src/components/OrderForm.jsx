import React, { useState } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './OrderForm.css';

function OrderForm({ 
  albums,
  deliveryNotes,
  onDeliveryNotesChange,
  onSubmit,
  isSubmitting = false
}) {
  const breakpoint = useBreakpoint();
  const isMobile = ['xs', 'ss', 'sm'].includes(breakpoint);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    deliveryAddress: '',
    mobileNumber: ''
  });

  const total = albums.reduce((sum, album) => {
    return sum + (album.selectedAlbum?.price || 0);
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return; // Prevent double submission
    }
    
    // Validate all albums are complete
    for (let i = 0; i < albums.length; i++) {
      const album = albums[i];
      if (!album.selectedAlbum) {
        alert(`Please select an album size for Album ${i + 1}.`);
        document.getElementById(`album-options-${i}`)?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (!album.smashTransferUrl) {
        alert(`Please upload photos for Album ${i + 1}.`);
        document.getElementById(`upload-photos-${i}`)?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (!album.cover) {
        alert(`Please customize the cover for Album ${i + 1}.`);
        return;
      }
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
                placeholder="Any special instructions for delivery or notes for us..."
                value={deliveryNotes}
                onChange={(e) => onDeliveryNotesChange(e.target.value)}
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
              <p><small>Your personal photos will be permanently deleted once your album is printed and delivered.</small></p>
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

