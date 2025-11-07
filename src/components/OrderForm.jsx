import React, { useState } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './OrderForm.css';

function OrderForm({ 
  selectedAlbum, 
  selectedColor, 
  giftWrap,
  onGiftWrapChange,
  deliveryNotes,
  onDeliveryNotesChange,
  smashTransferUrl, 
  fileCount,
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

  const total = selectedAlbum?.price || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return; // Prevent double submission
    }
    
    if (!selectedAlbum) {
      alert('Please select an album size first.');
      document.getElementById('album-options')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!smashTransferUrl) {
      alert('Please upload your photos first.');
      document.getElementById('upload-photos')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const orderData = {
      album: {
        size: selectedAlbum.size,
        color: selectedColor,
        price: selectedAlbum.price
      },
      customer: formData,
      smashTransferUrl,
      fileCount,
      giftWrap,
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
              <span>Album:</span>
              <span>{selectedAlbum ? `${selectedAlbum.size} Photos` : 'Not selected'}</span>
            </div>
            <div className="summary-item">
              <span>Color:</span>
              <span>{selectedAlbum ? selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1) : '-'}</span>
            </div>
            <div className="summary-item">
              <span>Gift Wrap:</span>
              <span>{giftWrap ? 'Yes' : 'No'}</span>
            </div>
            <div className="summary-total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
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
              <small style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                Add any special delivery instructions or notes for us
              </small>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="gift-wrap"
                  name="gift-wrap"
                  checked={giftWrap}
                  onChange={(e) => onGiftWrapChange(e.target.checked)}
                />
                <span>Gift wrap my album</span>
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
              />
              <small style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                We'll send you an order confirmation email
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

