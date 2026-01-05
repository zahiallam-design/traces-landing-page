# EmailJS Business Owner Order Notification Template

Copy and paste this template into your EmailJS Business Owner template.

## Template Content

```
New Album Order Received!

Order Date: {{order_date}}
Order Total: {{order_total}}
Number of Albums: {{album_count}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORDER DETAILS:
{{order_summary}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CUSTOMER DETAILS:
• Name: {{customer_name}}
• Email: {{customer_email}}
• Address: {{customer_address}}
• Phone: {{customer_phone}}

{{#customer_notes}}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DELIVERY NOTES:
{{customer_notes}}
{{/customer_notes}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please process this order and contact the customer via WhatsApp at {{customer_phone}}.
```

## Alternative Template (Using albums_details)

If you prefer a simpler format, you can use `{{albums_details}}` instead of `{{order_summary}}`:

```
New Album Order Received!

Order Date: {{order_date}}
Order Total: {{order_total}}
Number of Albums: {{album_count}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALBUMS:
{{albums_details}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CUSTOMER DETAILS:
• Name: {{customer_name}}
• Email: {{customer_email}}
• Address: {{customer_address}}
• Phone: {{customer_phone}}

{{#customer_notes}}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DELIVERY NOTES:
{{customer_notes}}
{{/customer_notes}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please process this order and contact the customer via WhatsApp at {{customer_phone}}.
```

## Template Variables Used

- `{{order_date}}` - Order date and time
- `{{order_total}}` - Total order amount
- `{{album_count}}` - Number of albums ordered
- `{{order_summary}}` - Complete formatted order summary with all album details (recommended)
- `{{albums_details}}` - Simple formatted list of albums (alternative)
- `{{customer_name}}` - Customer's full name
- `{{customer_email}}` - Customer's email address
- `{{customer_address}}` - Customer's delivery address
- `{{customer_phone}}` - Customer's mobile number
- `{{customer_notes}}` - Delivery notes (optional, shown only if provided)

## Setup Instructions

1. Go to your EmailJS Dashboard
2. Navigate to **Email Templates**
3. Find or create your **Business Owner Order Notification** template
4. Paste the template content above
5. Make sure the **To Email** field is set to: Your business email address
6. Set the **Subject** to: `New Album Order - {{customer_name}}`
7. Click **Save**
8. Copy the Template ID and use it as `EMAILJS_TEMPLATE_ID` in your environment variables

## What's Included in order_summary

The `{{order_summary}}` variable includes:
- All albums with their details (size, color, price)
- Number of photos per album
- Smash Transfer URL for each album
- Cover customization details (image or text with title/date)
- Customer information
- Delivery notes
- Total amount

## Notes

- The template uses conditional blocks `{{#customer_notes}}...{{/customer_notes}}` to show delivery notes only when provided
- `{{order_summary}}` provides a complete formatted summary - recommended for business owner emails
- `{{albums_details}}` provides a simpler one-line-per-album format - use if you prefer a more compact view
- Gift wrap has been removed as it's no longer part of the order process

