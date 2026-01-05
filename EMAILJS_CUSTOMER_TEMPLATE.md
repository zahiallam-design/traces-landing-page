# EmailJS Customer Order Confirmation Template

Copy and paste this template into your EmailJS Customer Confirmation template.

## Template Content

```
Hello {{customer_name}},

Thank you for your order! We've received it and will start processing soon.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORDER DETAILS:
{{#albums_details}}{{albums_details}}{{/albums_details}}

{{#customer_notes}}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DELIVERY NOTES:
{{customer_notes}}
{{/customer_notes}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DELIVERY ADDRESS:
{{delivery_address}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOTAL: {{order_total}}
PAYMENT: Cash on Delivery

Order Date: {{order_date}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT'S NEXT?
We'll print your photos, assemble your beautiful albums, and deliver them to your door. You'll receive updates via WhatsApp.

If you have any questions, feel free to contact us via WhatsApp.

Thank you for choosing Traces!
```

## Alternative Template (Better Formatting for Multiple Albums)

If you want a more detailed breakdown of each album, use this version:

```
Hello {{customer_name}},

Thank you for your order! We've received it and will start processing soon.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORDER SUMMARY:
Number of Albums: {{album_count}}

{{order_summary}}

{{#customer_notes}}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DELIVERY NOTES:
{{customer_notes}}
{{/customer_notes}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DELIVERY ADDRESS:
{{delivery_address}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOTAL: {{order_total}}
PAYMENT: Cash on Delivery

Order Date: {{order_date}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT'S NEXT?
We'll print your photos, assemble your beautiful albums, and deliver them to your door. You'll receive updates via WhatsApp.

If you have any questions, feel free to contact us via WhatsApp.

Thank you for choosing Traces!
```

## Template Variables Used

- `{{customer_name}}` - Customer's full name
- `{{customer_email}}` - Customer's email address
- `{{album_count}}` - Number of albums ordered
- `{{albums_details}}` - Formatted list of all albums (simple format)
- `{{order_summary}}` - Complete formatted order summary (detailed format)
- `{{customer_notes}}` - Delivery notes (optional)
- `{{delivery_address}}` - Customer's delivery address
- `{{order_total}}` - Total order amount
- `{{order_date}}` - Order date and time

## Setup Instructions

1. Go to your EmailJS Dashboard
2. Navigate to **Email Templates**
3. Find or create your **Customer Confirmation** template
4. Paste the template content above
5. Make sure the **To Email** field is set to: `{{customer_email}}`
6. Set the **Subject** to: `Order Confirmation - Traces`
7. Click **Save**
8. Copy the Template ID and use it as `EMAILJS_CUSTOMER_TEMPLATE_ID` in your environment variables

## Notes

- The template uses conditional blocks `{{#variable}}...{{/variable}}` to show optional fields only when they exist
- `{{order_summary}}` provides a complete formatted summary with all album details
- `{{albums_details}}` provides a simpler one-line-per-album format
- Choose the template version that best fits your needs

