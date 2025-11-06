import emailjs from '@emailjs/browser';

// IMPORTANT: Replace these with your EmailJS credentials
// Get them from: https://dashboard.emailjs.com/admin
// You can use environment variables (VITE_EMAILJS_*) or hardcode them here
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
const EMAILJS_CUSTOMER_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CUSTOMER_TEMPLATE_ID || 'YOUR_CUSTOMER_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

/**
 * Initialize EmailJS with your public key
 * Call this once when your app starts (e.g., in App.jsx useEffect)
 */
export const initEmailJS = () => {
  if (EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
};

/**
 * Send order email to business owner using EmailJS
 * @param {Object} orderData - Complete order data object
 * @returns {Promise} Promise that resolves when email is sent
 */
export const sendOrderEmail = async (orderData) => {
  // Validate configuration
  if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') {
    throw new Error('EmailJS Service ID not configured. Please set EMAILJS_SERVICE_ID in src/services/emailService.js');
  }
  
  if (!EMAILJS_TEMPLATE_ID || EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID') {
    throw new Error('EmailJS Template ID not configured. Please set EMAILJS_TEMPLATE_ID in src/services/emailService.js');
  }
  
  if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
    throw new Error('EmailJS Public Key not configured. Please set EMAILJS_PUBLIC_KEY in src/services/emailService.js');
  }

  // Format order data for email template
  const templateParams = {
    // Order Information
    order_date: new Date(orderData.timestamp).toLocaleString(),
    order_total: `$${orderData.total.toFixed(2)}`,
    
    // Album Details
    album_size: `${orderData.album.size} Photos`,
    album_color: orderData.album.color.charAt(0).toUpperCase() + orderData.album.color.slice(1),
    album_price: `$${orderData.album.price.toFixed(2)}`,
    
    // Customer Details
    customer_name: orderData.customer.fullName,
    customer_email: orderData.customer.email || 'Not provided',
    customer_address: orderData.customer.deliveryAddress,
    customer_phone: orderData.customer.mobileNumber,
    
    // Photo Details
    photo_transfer_url: orderData.smashTransferUrl,
    photo_count: orderData.fileCount.toString(),
    
    // Extras
    gift_wrap: orderData.giftWrap ? 'Yes' : 'No',
    customer_notes: orderData.notes || 'None',
    
    // Formatted order summary (for easy reading)
    order_summary: formatOrderSummary(orderData),
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    return {
      success: true,
      status: response.status,
      text: response.text,
    };
  } catch (error) {
    console.error('EmailJS Error:', error);
    throw new Error(`Failed to send email: ${error.text || error.message}`);
  }
};

/**
 * Send order confirmation email to customer using EmailJS
 * @param {Object} orderData - Complete order data object
 * @returns {Promise} Promise that resolves when email is sent
 */
export const sendCustomerConfirmationEmail = async (orderData) => {
  // Validate configuration
  if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') {
    throw new Error('EmailJS Service ID not configured');
  }
  
  if (!EMAILJS_CUSTOMER_TEMPLATE_ID || EMAILJS_CUSTOMER_TEMPLATE_ID === 'YOUR_CUSTOMER_TEMPLATE_ID') {
    // If customer template not configured, skip sending customer email
    console.warn('Customer confirmation email template not configured. Skipping customer email.');
    return { success: false, skipped: true };
  }
  
  if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
    throw new Error('EmailJS Public Key not configured');
  }

  // Don't send if customer email is not provided
  if (!orderData.customer.email) {
    console.warn('Customer email not provided. Skipping customer confirmation email.');
    return { success: false, skipped: true };
  }

  // Format order data for customer confirmation email
  const templateParams = {
    // Customer name
    customer_name: orderData.customer.fullName,
    customer_email: orderData.customer.email,
    
    // Order Information
    order_date: new Date(orderData.timestamp).toLocaleString(),
    order_total: `$${orderData.total.toFixed(2)}`,
    
    // Album Details
    album_size: `${orderData.album.size} Photos`,
    album_color: orderData.album.color.charAt(0).toUpperCase() + orderData.album.color.slice(1),
    album_price: `$${orderData.album.price.toFixed(2)}`,
    
    // Delivery Details
    delivery_address: orderData.customer.deliveryAddress,
    
    // Extras
    gift_wrap: orderData.giftWrap ? 'Yes' : 'No',
    customer_notes: orderData.notes || 'None',
    
    // Formatted order summary for customer
    order_summary: formatCustomerOrderSummary(orderData),
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_CUSTOMER_TEMPLATE_ID,
      templateParams
    );
    
    return {
      success: true,
      status: response.status,
      text: response.text,
    };
  } catch (error) {
    console.error('EmailJS Customer Email Error:', error);
    // Don't throw - customer email failure shouldn't block order
    return { success: false, error: error.message };
  }
};

/**
 * Format order data as a readable summary for business owner email
 */
function formatOrderSummary(orderData) {
  return `
NEW ALBUM ORDER
================

ALBUM DETAILS:
- Size: ${orderData.album.size} Photos
- Color: ${orderData.album.color.charAt(0).toUpperCase() + orderData.album.color.slice(1)}
- Price: $${orderData.album.price.toFixed(2)}

CUSTOMER DETAILS:
- Name: ${orderData.customer.fullName}
- Email: ${orderData.customer.email || 'Not provided'}
- Address: ${orderData.customer.deliveryAddress}
- Mobile: ${orderData.customer.mobileNumber}

PHOTOS:
- Smash Transfer URL: ${orderData.smashTransferUrl}
- Number of Photos: ${orderData.fileCount}

EXTRAS:
- Gift Wrap: ${orderData.giftWrap ? 'Yes' : 'No'}
- Notes: ${orderData.notes || 'None'}

TOTAL: $${orderData.total.toFixed(2)}

Order Date: ${new Date(orderData.timestamp).toLocaleString()}
  `.trim();
}

/**
 * Format order data as a readable summary for customer confirmation email
 */
function formatCustomerOrderSummary(orderData) {
  return `
ORDER CONFIRMATION
==================

Thank you for your order, ${orderData.customer.fullName}!

Your order has been received and we'll start processing it soon.

ORDER DETAILS:
- Album: ${orderData.album.size} Photos, ${orderData.album.color.charAt(0).toUpperCase() + orderData.album.color.slice(1)} Color
- Price: $${orderData.album.price.toFixed(2)}
- Gift Wrap: ${orderData.giftWrap ? 'Yes' : 'No'}
${orderData.notes ? `- Special Notes: ${orderData.notes}` : ''}

DELIVERY ADDRESS:
${orderData.customer.deliveryAddress}

TOTAL: $${orderData.total.toFixed(2)}

PAYMENT: Cash on Delivery

Order Date: ${new Date(orderData.timestamp).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT'S NEXT?
We'll print your photos, assemble your beautiful album, and deliver it to your door. You'll receive updates via WhatsApp at ${orderData.customer.mobileNumber}.

If you have any questions, feel free to contact us via WhatsApp.

Thank you for choosing Your Albums!
  `.trim();
}

