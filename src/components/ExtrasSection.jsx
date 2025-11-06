import React from 'react';
import './ExtrasSection.css';

function ExtrasSection({ notes, onNotesChange, giftWrap, onGiftWrapChange }) {
  return (
    <section className="extras-section">
      <div className="container">
        <div className="extras-content">
          <div className="notes-field">
            <label htmlFor="notes">Add a special note to include with your album (optional)</label>
            <textarea
              id="notes"
              name="notes"
              rows="4"
              placeholder="Write your message here..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>
          <div className="gift-wrap-field">
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
        </div>
      </div>
    </section>
  );
}

export default ExtrasSection;

