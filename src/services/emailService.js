// EmailJS credentials are now handled server-side via Vercel Serverless Functions
// No credentials needed in frontend - more secure!

/**
 * Initialize EmailJS (no longer needed, but kept for compatibility)
 * Email sending now happens via serverless function
 */
export const initEmailJS = () => {
  // No initialization needed - emails sent via serverless function
  console.log('EmailJS initialized (using serverless function)');
};

/**
 * Send order email to business owner using EmailJS
 * @param {Object} orderData - Complete order data object
 * @returns {Promise} Promise that resolves when email is sent
 */
export const sendOrderEmail = async (orderData) => {
  // No validation needed - serverless function handles configuration

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
    // Send email via serverless function (secure - credentials on server)
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateType: 'owner',
        templateParams: templateParams,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to send email');
    }

    const result = await response.json();
    
    return {
      success: true,
      status: 200,
      text: result.message || 'Email sent successfully',
    };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send order confirmation email to customer using EmailJS
 * @param {Object} orderData - Complete order data object
 * @returns {Promise} Promise that resolves when email is sent
 */
export const sendCustomerConfirmationEmail = async (orderData) => {
  // Don't send if customer email is not provided
  if (!orderData.customer.email) {
    console.warn('Customer email not provided. Skipping customer confirmation email.');
    return { success: false, skipped: true };
  }
  
  // Serverless function handles template configuration

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
    // Send email via serverless function (secure - credentials on server)
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateType: 'customer',
        templateParams: templateParams,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Don't throw - customer email failure shouldn't block order
      return { success: false, error: errorData.error || errorData.message };
    }

    const result = await response.json();
    
    return {
      success: true,
      status: 200,
      text: result.message || 'Email sent successfully',
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

Thank you for choosing Traces!
  `.trim();
}

