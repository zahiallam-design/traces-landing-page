import React from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './HowItWorks.css';

const steps = [
  {
    number: 1,
    title: 'Choose your album: 50 or 100 photos',
    description: 'Select the size and color that fits your memories'
  },
  {
    number: 2,
    title: 'Upload your photos directly',
    description: 'Send us your favorite moments easily and securely'
  },
  {
    number: 3,
    title: 'Fill your details and submit your order',
    description: 'Tell us where to deliver your beautiful album'
  },
  {
    number: 4,
    title: 'We print, assemble, and deliver',
    description: 'We print your photos, assemble your album, and deliver it to your door — cash on delivery'
  }
];

function HowItWorks() {
  const breakpoint = useBreakpoint();
  const isMobile = ['xs', 'ss', 'sm'].includes(breakpoint);

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <h2 className="section-title">How It Works</h2>
        <div className={`steps ${isMobile ? 'steps-mobile' : ''}`}>
          {steps.map((step) => (
            <div key={step.number} className="step">
              <div className="step-number">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;

