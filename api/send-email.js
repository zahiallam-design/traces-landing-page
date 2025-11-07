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
    // In Vercel serverless functions, body is available as req.body
    // It should be automatically parsed for application/json
    let body;
    
    // Log for debugging
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    if (req.body) {
      // Body might already be parsed (object) or still be a string
      if (typeof req.body === 'string') {
        try {
          body = JSON.parse(req.body);
        } catch (e) {
          console.error('JSON parse error:', e);
          return res.status(400).json({ error: 'Invalid JSON in request body' });
        }
      } else {
        body = req.body;
      }
    } else {
      // Try reading raw body if req.body is not available
      console.log('req.body is undefined, attempting to read raw body...');
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString();
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        console.error('Failed to parse raw body:', e);
        return res.status(400).json({ error: 'Invalid request body' });
      }
    }
    
    console.log('Parsed body:', body);
    
    const { 
      templateType, // 'owner' or 'customer'
      templateParams 
    } = body;

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
      
      // Check if it's the "non-browser applications" error
      if (errorText.includes('non-browser applications') || errorText.includes('disabled for non-browser')) {
        return res.status(emailjsResponse.status).json({
          error: 'EmailJS server-side API is disabled',
          details: 'Please enable "Allow EmailJS API for non-browser applications" in your EmailJS account settings (Account → Security).',
          errorText: errorText,
        });
      }
      
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

