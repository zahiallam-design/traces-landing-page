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
    const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || process.env.VITE_EMAILJS_PRIVATE_KEY;

    // Validate required credentials
    if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
      return res.status(500).json({ error: 'EmailJS credentials not configured' });
    }
    
    // Private key is required for server-side API calls in strict mode
    if (!EMAILJS_PRIVATE_KEY) {
      return res.status(500).json({ 
        error: 'EmailJS private key not configured',
        details: 'Please add EMAILJS_PRIVATE_KEY to your Vercel environment variables. Get it from EmailJS Dashboard → Account → Security.'
      });
    }

    // Get request body
    // In Vercel serverless functions, body is available as req.body
    // It should be automatically parsed for application/json
    let body;
    
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
        accessToken: EMAILJS_PRIVATE_KEY, // Required for server-side API calls in strict mode
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

    // EmailJS can return either JSON or plain text "OK" for success
    const contentType = emailjsResponse.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await emailjsResponse.json();
    } else {
      // Plain text response (like "OK")
      const textResponse = await emailjsResponse.text();
      result = { status: 'success', message: textResponse || 'Email sent successfully' };
    }

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

