# EmailJS Setup Guide

This guide will help you set up EmailJS to receive order emails when customers place orders.

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Add Email Service

1. Log into your EmailJS dashboard
2. Go to **Email Services** in the left sidebar
3. Click **Add New Service**
4. Choose your email provider (Gmail recommended for easy setup)
5. Follow the prompts to connect your email account
6. **Copy the Service ID** - you'll need this later

## Step 3: Create Email Templates

You'll need to create **TWO** email templates:
1. **Business Owner Template** - For receiving order notifications
2. **Customer Confirmation Template** - For sending order confirmations to customers

### Template 1: Business Owner Order Notification

1. Go to **Email Templates** in the left sidebar
2. Click **Create New Template**
3. Name it something like "Album Order Notification"
4. Set the **To Email** field to your email address (the one you want to receive orders)
5. Set the **Subject** to: `New Album Order - {{customer_name}}`
6. In the **Content** field, use this template:

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

7. Click **Save**
8. **Copy the Template ID** - this is your `EMAILJS_TEMPLATE_ID` (for business owner)

### Template 2: Customer Order Confirmation

1. In EmailJS dashboard, go to **Email Templates**
2. Click **Create New Template**
3. Name it: "Customer Order Confirmation"
4. Set the **To Email** field to: `{{customer_email}}` (this will use the customer's email)
5. Set the **Subject** to: `Order Confirmation - Traces`
6. In the **Content** field, use this template:

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

7. Click **Save**
8. **Copy the Template ID** - this is your `EMAILJS_CUSTOMER_TEMPLATE_ID` (for customer confirmation)

## Step 4: Get Your Public Key

1. Go to **Account** → **General** in the left sidebar
2. Find **Public Key** (also called User ID)
3. **Copy the Public Key** - you'll need this later

## Step 5: Configure Your React App

### Option 1: Hardcode in Code (Quick Start)

1. Open `src/services/emailService.js` in your project
2. Replace the placeholder values with your actual credentials:

```javascript
const EMAILJS_SERVICE_ID = 'your_service_id_here';           // From Step 2
const EMAILJS_TEMPLATE_ID = 'your_template_id_here';         // From Step 3 (Business Owner)
const EMAILJS_CUSTOMER_TEMPLATE_ID = 'your_customer_template_id'; // From Step 3 (Customer)
const EMAILJS_PUBLIC_KEY = 'your_public_key_here';           // From Step 4
```

### Option 2: Use Environment Variables (Recommended for Production)

1. In Vercel, go to **Project Settings** → **Environment Variables**
2. Add these **4 EmailJS variables**:
   - `VITE_EMAILJS_SERVICE_ID` = Your Service ID
   - `VITE_EMAILJS_TEMPLATE_ID` = Your Business Owner Template ID
   - `VITE_EMAILJS_CUSTOMER_TEMPLATE_ID` = Your Customer Template ID
   - `VITE_EMAILJS_PUBLIC_KEY` = Your Public Key
3. Set environments to: **Production**, **Preview**, **Development** (for each variable)
4. Click **"Save"** for each
5. **Redeploy** your site (Deployments → Redeploy)

The code already supports environment variables, so no code changes needed!

**📋 See `ENVIRONMENT_VARIABLES.md` for complete list of all variables**

## Step 6: Test Your Setup

1. Run your React app: `npm run dev`
2. Fill out a test order (including email address)
3. Click "Place Order"
4. Check **two** email inboxes:
   - **Your business email** - Should receive order notification
   - **Customer email** (the one you entered) - Should receive order confirmation

Both emails should arrive within seconds!

## EmailJS Free Tier Limits

- **200 emails per month** (perfect for starting out)
- **2 email services**
- **2 email templates**

For more emails, upgrade to a paid plan starting at $15/month.

## Troubleshooting

### Email not received?
1. Check your spam/junk folder
2. Verify the "To Email" field in your template matches your email
3. Check browser console for error messages
4. Verify all three IDs are correctly set in `emailService.js`

### "Service ID not configured" error?
- Make sure you've replaced `YOUR_SERVICE_ID` with your actual Service ID

### "Template ID not configured" error?
- Make sure you've replaced `YOUR_TEMPLATE_ID` with your actual Template ID

### "Public Key not configured" error?
- Make sure you've replaced `YOUR_PUBLIC_KEY` with your actual Public Key

### Customer email not received?
- Make sure you created the Customer Confirmation template
- Verify `EMAILJS_CUSTOMER_TEMPLATE_ID` is set correctly
- Check that customer entered a valid email address
- Customer email is optional - order will still be processed

### Email sent but fields are empty?
- Check that your template uses the exact variable names:
  - `{{customer_name}}`
  - `{{customer_email}}`
  - `{{order_date}}`
  - `{{order_total}}`
  - `{{album_size}}`
  - `{{album_color}}`
  - `{{delivery_address}}`
  - etc.

## Security Note

The EmailJS Public Key is safe to expose in frontend code. However, for production, consider:
- Setting up rate limiting
- Adding server-side validation
- Using environment variables for sensitive data

## Support

- EmailJS Documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- EmailJS Support: Check their website for support options

