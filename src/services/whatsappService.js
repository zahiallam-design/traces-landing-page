/**
 * Send order confirmation via WhatsApp
 * Currently uses WhatsApp link with pre-filled message
 * Can be upgraded to use WhatsApp Business API or Twilio for automated sending
 * 
 * @param {Object} orderData - Complete order data object
 * @param {string} phoneNumber - Customer's phone number
 * @returns {Promise} Promise that resolves when WhatsApp message is prepared
 */
export const sendWhatsAppConfirmation = async (orderData, phoneNumber) => {
  // Format order summary for WhatsApp
  const orderSummary = formatOrderSummaryForWhatsApp(orderData);
  
  // Clean customer phone number (remove spaces, dashes, etc.)
  // Ensure it starts with country code (add 961 for Lebanon if missing)
  let cleanPhone = phoneNumber.replace(/[\s\-+()]/g, '');
  
  // If phone doesn't start with country code, add Lebanon code (961)
  if (!cleanPhone.startsWith('961') && cleanPhone.length <= 8) {
    cleanPhone = '961' + cleanPhone;
  }
  
  // Create WhatsApp link with pre-filled message TO THE CUSTOMER
  // Format: https://api.whatsapp.com/send?phone=[customer_number]&text=[message]
  const message = encodeURIComponent(orderSummary);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`;
  
  // Open WhatsApp with pre-filled message to customer
  // Note: WhatsApp Web API doesn't support automatic sending - it only opens WhatsApp with a pre-filled message
  // The user still needs to click send. For true automation, you'd need WhatsApp Business API or Twilio
  // Using window.location instead of window.open to avoid opening in new tab
  window.location.href = whatsappUrl;
  
  return {
    success: true,
    message: 'WhatsApp confirmation prepared'
  };
};

/**
 * Format order summary for WhatsApp message
 */
function formatOrderSummaryForWhatsApp(orderData) {
  let albumsText = '';
  orderData.albums.forEach((albumData, index) => {
    const coverInfo = albumData.cover?.type === 'image' 
      ? 'Image cover'
      : albumData.cover?.type === 'text' 
        ? `Text: "${albumData.cover.title}"`
        : 'Not selected';
    
    albumsText += `\n*Album ${index + 1}:*\n`;
    albumsText += `• Size: ${albumData.album.size} Photos\n`;
    albumsText += `• Color: ${albumData.album.color.charAt(0).toUpperCase() + albumData.album.color.slice(1)}\n`;
    albumsText += `• Price: $${albumData.album.price.toFixed(2)}\n`;
    albumsText += `• Photos: ${albumData.fileCount} photos\n`;
    albumsText += `• Cover: ${coverInfo}\n`;
  });

  const total = orderData.albums.reduce((sum, album) => sum + album.album.price, 0);
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '71532156';
  const cleanWhatsAppNumber = whatsappNumber.replace(/[\s\-+()]/g, '');

  return `*ORDER CONFIRMATION*

Hello! Thank you for your order, ${orderData.customer.fullName}!

Your order has been received and we'll start processing it soon.

*ORDER NUMBER:* ${orderData.orderNumber || 'N/A'}

*ORDER DETAILS:*
${albumsText}
*DELIVERY ADDRESS:*
${orderData.customer.deliveryAddress}

${orderData.notes ? `*DELIVERY NOTES:*\n${orderData.notes}\n\n` : ''}*TOTAL:* $${total.toFixed(2)}

*PAYMENT:* Cash on Delivery

Order Date: ${orderData.timestamp ? new Date(orderData.timestamp).toLocaleString() : new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*WHAT'S NEXT?*
We'll print your photos, assemble your ${orderData.albums.length > 1 ? 'albums' : 'album'}, and deliver ${orderData.albums.length > 1 ? 'them' : 'it'} to your doorstep within 3 to 5 business days.

If you have any questions, feel free to contact us via WhatsApp: https://api.whatsapp.com/send?phone=${cleanWhatsAppNumber}

Thank you for choosing Traces!`.trim();
}
