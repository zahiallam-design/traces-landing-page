import React from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './HowItWorks.css';

const steps = [
  {
    number: 1,
    title: 'Select number of albums',
    description: 'Choose how many albums you want to order (1 to 5 albums)'
  },
  {
    number: 2,
    title: 'Choose your album size and color',
    description: 'Select 50 or 100 photos and pick your preferred color (green or grey)'
  },
  {
    number: 3,
    title: 'Upload your photos',
    description: 'Send us your favorite moments easily and securely'
  },
  {
    number: 4,
    title: 'Customize your album cover',
    description: 'Choose an image cover or add a text title with optional date'
  },
  {
    number: 5,
    title: 'Fill your details and submit',
    description: 'Tell us where to deliver your beautiful albums'
  },
  {
    number: 6,
    title: 'We print, assemble, and deliver',
    description: 'We print your photos, assemble your albums, and deliver them to your door — cash on delivery'
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

