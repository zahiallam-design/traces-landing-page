/**
 * Vercel Serverless Function for EmailJS
 * This keeps EmailJS credentials secure on the server side
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get EmailJS credentials from environment variables (server-side only)
    const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
    const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID;
    const EMAILJS_CUSTOMER_TEMPLATE_ID = process.env.EMAILJS_CUSTOMER_TEMPLATE_ID || process.env.VITE_EMAILJS_CUSTOMER_TEMPLATE_ID;
    const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;

    // Validate required credentials
    if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
      return res.status(500).json({ error: 'EmailJS credentials not configured' });
    }

    // Get request body
    const { 
      templateType, // 'owner' or 'customer'
      templateParams 
    } = await req.json();

    if (!templateType || !templateParams) {
      return res.status(400).json({ error: 'Missing templateType or templateParams' });
    }

    // Select template ID based on type
    const templateId = templateType === 'customer' 
      ? (EMAILJS_CUSTOMER_TEMPLATE_ID || EMAILJS_TEMPLATE_ID)
      : EMAILJS_TEMPLATE_ID;

    if (!templateId) {
      return res.status(500).json({ error: 'EmailJS template ID not configured' });
    }

    // Send email via EmailJS API
    const emailjsUrl = `https://api.emailjs.com/api/v1.0/email/send`;
    
    const emailjsResponse = await fetch(emailjsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: templateId,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: templateParams,
      }),
    });

    if (!emailjsResponse.ok) {
      const errorText = await emailjsResponse.text();
      console.error('EmailJS API error:', errorText);
      return res.status(emailjsResponse.status).json({
        error: 'Failed to send email',
        details: errorText,
      });
    }

    const result = await emailjsResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      result: result,
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({
      error: 'Email sending failed',
      message: error.message || 'Unknown error occurred',
    });
  }
}

