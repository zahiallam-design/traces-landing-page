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
    
    // Multiple Albums - format as text
    album_count: orderData.albums.length.toString(),
    albums_details: formatAlbumsDetails(orderData.albums),
    
    // Customer Details
    customer_name: orderData.customer.fullName,
    customer_email: orderData.customer.email || 'Not provided',
    customer_address: orderData.customer.deliveryAddress,
    customer_phone: orderData.customer.mobileNumber,
    
    // Notes
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
    
    // Multiple Albums
    album_count: orderData.albums.length.toString(),
    albums_details: formatAlbumsDetails(orderData.albums),
    
    // Delivery Details
    delivery_address: orderData.customer.deliveryAddress,
    
    // Notes
    customer_notes: orderData.notes || 'None',
    
    // WhatsApp link
    whatsapp_link: (() => {
      const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '71532156';
      const cleanNumber = whatsappNumber.replace(/[\s\-+()]/g, '');
      return `https://api.whatsapp.com/send?phone=${cleanNumber}`;
    })(),
    
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
 * Format albums details as text for email templates
 */
function formatAlbumsDetails(albums) {
  return albums.map((albumData, index) => {
    const coverInfo = albumData.cover?.type === 'image' 
      ? (albumData.cover.imageUrl ? `Image cover - URL: ${albumData.cover.imageUrl}` : 'Image cover')
      : albumData.cover?.type === 'text' 
        ? `Text: "${albumData.cover.title}"${albumData.cover.date ? ` - ${albumData.cover.date}` : ''}`
        : 'Not selected';
    
    return `• Album ${index + 1}: ${albumData.album.size} Photos, ${albumData.album.color.charAt(0).toUpperCase() + albumData.album.color.slice(1)} Color - $${albumData.album.price.toFixed(2)} (${albumData.fileCount} photos, Cover: ${coverInfo})`;
  }).join('\n');
}

/**
 * Format order data as a readable summary for business owner email
 */
function formatOrderSummary(orderData) {
  let albumsText = '';
  orderData.albums.forEach((albumData, index) => {
    const coverInfo = albumData.cover?.type === 'image' 
      ? (albumData.cover.imageUrl ? `Image cover - URL: ${albumData.cover.imageUrl}` : 'Image cover')
      : albumData.cover?.type === 'text' 
        ? `Text: "${albumData.cover.title}"${albumData.cover.date ? ` - ${albumData.cover.date}` : ''}`
        : 'Not selected';
    
    albumsText += `
ALBUM ${index + 1}:
- Size: ${albumData.album.size} Photos
- Color: ${albumData.album.color.charAt(0).toUpperCase() + albumData.album.color.slice(1)}
- Price: $${albumData.album.price.toFixed(2)}
- Photos: ${albumData.fileCount} photos
- Transfer URL: ${albumData.smashTransferUrl}
- Cover: ${coverInfo}
`;
  });

  return `
NEW ALBUM ORDER
================

NUMBER OF ALBUMS: ${orderData.albums.length}

${albumsText}
CUSTOMER DETAILS:
- Name: ${orderData.customer.fullName}
- Email: ${orderData.customer.email || 'Not provided'}
- Address: ${orderData.customer.deliveryAddress}
- Mobile: ${orderData.customer.mobileNumber}

DELIVERY NOTES:
${orderData.notes || 'None'}

TOTAL: $${orderData.total.toFixed(2)}

Order Date: ${new Date(orderData.timestamp).toLocaleString()}
  `.trim();
}

/**
 * Format order data as a readable summary for customer confirmation email
 */
function formatCustomerOrderSummary(orderData) {
  let albumsText = '';
  orderData.albums.forEach((albumData, index) => {
    const coverInfo = albumData.cover?.type === 'image' 
      ? (albumData.cover.imageUrl ? `Image cover` : 'Image cover')
      : albumData.cover?.type === 'text' 
        ? `Text: "${albumData.cover.title}"${albumData.cover.date ? ` - ${albumData.cover.date}` : ''}`
        : 'Not selected';
    
    albumsText += `
ALBUM ${index + 1}:
• Size: ${albumData.album.size} Photos
• Color: ${albumData.album.color.charAt(0).toUpperCase() + albumData.album.color.slice(1)}
• Price: $${albumData.album.price.toFixed(2)}
• Photos: ${albumData.fileCount} photos
• Cover: ${coverInfo}
`;
  });

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '71532156';
  const cleanWhatsAppNumber = whatsappNumber.replace(/[\s\-+()]/g, '');
  const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanWhatsAppNumber}`;

  return `
ORDER CONFIRMATION
==================

Hello! Thank you for your order, ${orderData.customer.fullName}!

Your order has been received and we'll start processing it soon.

ORDER DETAILS:
${albumsText}
DELIVERY ADDRESS:
${orderData.customer.deliveryAddress}

${orderData.notes ? `DELIVERY NOTES:\n${orderData.notes}\n\n` : ''}TOTAL: $${orderData.total.toFixed(2)}

PAYMENT: Cash on Delivery

Order Date: ${new Date(orderData.timestamp).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT'S NEXT?
We'll print your photos, assemble your beautiful ${orderData.albums.length > 1 ? 'albums' : 'album'}, and deliver ${orderData.albums.length > 1 ? 'them' : 'it'} to your door.

If you have any questions, feel free to contact us via WhatsApp: ${whatsappLink}

Thank you for choosing Traces!
  `.trim();
}

