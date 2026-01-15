import React, { useMemo, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { sendFeedbackEmail } from '../services/emailService';
import './FeedbackForm.css';

function FeedbackForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  const homeUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '/';
    }
    const baseUrl = import.meta.env.BASE_URL || '/';
    return new URL(baseUrl, window.location.origin).toString();
  }, []);

  const validate = () => {
    if (!name.trim()) {
      return 'Please enter your name.';
    }
    if (!phone.trim()) {
      return 'Please enter your phone number.';
    }
    if (!message.trim()) {
      return 'Please share your feedback.';
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const errorMessage = validate();
    if (errorMessage) {
      setStatus({ type: 'error', message: errorMessage });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      await sendFeedbackEmail({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      setStatus({ type: 'success', message: 'Thanks for the feedback! Redirecting...' });
      setTimeout(() => {
        window.location.assign(homeUrl);
      }, 1200);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send feedback. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-page">
      <Header />
      <main className="feedback-main">
        <div className="container">
          <div className="feedback-card">
            <h1 className="feedback-title">We would love your feedback</h1>
            <p className="feedback-subtitle">
              Share your thoughts or suggestions. It helps us improve.
            </p>
            <form className="feedback-form" onSubmit={handleSubmit}>
              <label className="feedback-label" htmlFor="feedback-name">
                Name
              </label>
              <input
                id="feedback-name"
                type="text"
                className="feedback-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
              />

              <label className="feedback-label" htmlFor="feedback-phone">
                Phone
              </label>
              <input
                id="feedback-phone"
                type="tel"
                className="feedback-input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number"
                required
              />

              <label className="feedback-label" htmlFor="feedback-email">
                Email (optional)
              </label>
              <input
                id="feedback-email"
                type="email"
                className="feedback-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@email.com"
              />

              <label className="feedback-label" htmlFor="feedback-message">
                Feedback
              </label>
              <textarea
                id="feedback-message"
                className="feedback-textarea"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write your feedback here..."
                rows={5}
                required
              />

              {status.message && (
                <div className={`feedback-status feedback-status-${status.type}`}>
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary feedback-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default FeedbackForm;
