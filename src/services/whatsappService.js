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
  
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phoneNumber.replace(/[\s\-+()]/g, '');
  
  // Create WhatsApp link with pre-filled message
  // Format: https://api.whatsapp.com/send?phone=[number]&text=[message]
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '71532156';
  const cleanWhatsAppNumber = whatsappNumber.replace(/[\s\-+()]/g, '');
  
  // For now, we'll return the link to open WhatsApp
  // In the future, this can be upgraded to use WhatsApp Business API or Twilio
  // to automatically send the message
  
  const message = encodeURIComponent(orderSummary);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanWhatsAppNumber}&text=${message}`;
  
  // Open WhatsApp with pre-filled message
  // Note: This opens WhatsApp, but doesn't automatically send
  // For automatic sending, you'll need WhatsApp Business API or Twilio
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  
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
        ? `Text: "${albumData.cover.title}"${albumData.cover.date ? ` - ${albumData.cover.date}` : ''}`
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
