# Extended Payment Methods Setup Guide

This guide covers setup instructions for PayPal, Cryptocurrency (Coinbase Commerce), and Card payments (Stripe) in addition to M-Pesa and Airtel Money.

## Table of Contents
1. [PayPal Setup](#paypal-setup)
2. [Stripe Setup (Card Payments)](#stripe-setup)
3. [Coinbase Commerce Setup (Crypto)](#coinbase-commerce-setup)
4. [Environment Configuration](#environment-configuration)
5. [Testing](#testing)
6. [Webhook Configuration](#webhook-configuration)
7. [Production Deployment](#production-deployment)

---

## PayPal Setup

### 1. Create PayPal Developer Account
1. Visit [PayPal Developer Portal](https://developer.paypal.com/)
2. Sign in with your PayPal account or create a new one
3. Go to **Dashboard** → **Apps & Credentials**

### 2. Create an App
1. Click **Create App**
2. Enter your app name (e.g., "EAA Tuk-Tuk Payments")
3. Select **Merchant** as the app type
4. Click **Create App**

### 3. Get API Credentials
**Sandbox Credentials:**
- Client ID: Found under "Sandbox" tab
- Secret: Click "Show" to reveal
- Use these for development/testing

**Live Credentials:**
- Client ID: Found under "Live" tab
- Secret: Click "Show" to reveal
- Use these for production

### 4. Configure Webhook
1. Go to **Webhooks** in the sidebar
2. Click **Add Webhook**
3. Enter your webhook URL: `https://your-domain.com/api/payments/paypal/webhook`
4. Select event types:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `CHECKOUT.ORDER.APPROVED`
5. Save the Webhook ID

### 5. Environment Variables
```env
PAYPAL_CLIENT_ID=your_sandbox_or_live_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_or_live_secret
PAYPAL_ENV=sandbox # or production
PAYPAL_WEBHOOK_ID=your_webhook_id
```

---

## Stripe Setup

### 1. Create Stripe Account
1. Visit [Stripe](https://stripe.com)
2. Sign up for a new account
3. Complete business verification (required for live mode)

### 2. Get API Keys
1. Go to **Developers** → **API Keys**
2. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 3. Enable Payment Methods
1. Go to **Settings** → **Payment methods**
2. Enable:
   - Credit/Debit cards
   - Apple Pay
   - Google Pay
   - Local payment methods (optional)

### 4. Configure Webhooks
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-domain.com/api/payments/stripe/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the **Signing secret** (starts with `whsec_`)

### 5. Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_ENV=test # or production
```

### 6. Test Cards
Use these test cards in sandbox mode:
- **Success:** `4242 4242 4242 4242`
- **Requires authentication:** `4000 0025 0000 3155`
- **Declined:** `4000 0000 0000 9995`
- Any future expiry date, any 3-digit CVC

---

## Coinbase Commerce Setup

### 1. Create Coinbase Commerce Account
1. Visit [Coinbase Commerce](https://commerce.coinbase.com/)
2. Sign up with your email
3. Complete KYC verification
4. Set up your business profile

### 2. Get API Key
1. Go to **Settings** → **API Keys**
2. Click **Create an API Key**
3. Name it (e.g., "EAA Tuk-Tuk")
4. Copy the API key (starts with a long string)
5. **Important:** Save this key immediately - you can't view it again!

### 3. Configure Webhook
1. Go to **Settings** → **Webhook subscriptions**
2. Click **Add an endpoint**
3. Enter your webhook URL: `https://your-domain.com/api/payments/crypto/webhook`
4. Select events:
   - `charge:created`
   - `charge:confirmed`
   - `charge:failed`
   - `charge:delayed`
   - `charge:pending`
5. Copy the **Shared secret** for webhook verification

### 4. Enable Cryptocurrencies
Coinbase Commerce automatically accepts:
- Bitcoin (BTC)
- Ethereum (ETH)
- Bitcoin Cash (BCH)
- Litecoin (LTC)
- USD Coin (USDC)
- DAI

### 5. Environment Variables
```env
COINBASE_COMMERCE_API_KEY=your_api_key
COINBASE_COMMERCE_WEBHOOK_SECRET=your_shared_secret
CRYPTO_ENV=sandbox # Note: Coinbase uses same API for sandbox and production
```

---

## Environment Configuration

### Complete `.env` File for Payment Service
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eaa_db
DB_USER=eaa_user
DB_PASSWORD=eaa_password

# Service Configuration
PAYMENT_SERVICE_PORT=3004
NODE_ENV=development

# M-Pesa Configuration
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback

# Airtel Money Configuration
AIRTEL_ENV=sandbox
AIRTEL_CLIENT_ID=your_client_id
AIRTEL_CLIENT_SECRET=your_client_secret
AIRTEL_API_KEY=your_api_key
AIRTEL_CALLBACK_URL=https://your-domain.com/api/payments/airtel/callback

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id

# Coinbase Commerce (Crypto)
COINBASE_COMMERCE_API_KEY=your_coinbase_commerce_api_key
COINBASE_COMMERCE_WEBHOOK_SECRET=your_webhook_secret
CRYPTO_ENV=sandbox

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_ENV=test

# Service URLs
BOOKING_SERVICE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

---

## Testing

### PayPal Testing
1. Use PayPal sandbox accounts from Developer Dashboard
2. Test buyer account credentials are provided automatically
3. Test flow:
   - Initiate PayPal payment
   - Redirect to PayPal
   - Login with sandbox buyer account
   - Approve payment
   - Capture payment on return

### Stripe Testing
Use test card numbers:
```
Success: 4242 4242 4242 4242
3D Secure: 4000 0025 0000 3155
Declined: 4000 0000 0000 9995
Insufficient funds: 4000 0000 0000 9995
```

### Crypto Testing
1. Use Coinbase Commerce testnet
2. Generate test charges
3. Simulate blockchain confirmations
4. Test webhook callbacks

---

## Webhook Configuration

### Local Development (ngrok)
```bash
# Install ngrok
npm install -g ngrok

# Start your payment service
npm run dev

# In another terminal, expose port 3004
ngrok http 3004

# Use the ngrok URL for webhooks:
# https://abc123.ngrok.io/api/payments/mpesa/callback
# https://abc123.ngrok.io/api/payments/stripe/webhook
```

### Webhook Endpoints
```
M-Pesa:     POST /api/payments/mpesa/callback
Airtel:     POST /api/payments/airtel/callback
PayPal:     POST /api/payments/paypal/webhook
Stripe:     POST /api/payments/stripe/webhook
Crypto:     POST /api/payments/crypto/webhook
```

### Webhook Security
- All webhooks verify signatures
- M-Pesa: Password-based verification
- Airtel: API key verification
- PayPal: Signature verification with webhook ID
- Stripe: Signature verification with webhook secret
- Coinbase: HMAC SHA256 signature verification

---

## API Endpoints

### Initiate Payment
```http
POST /api/payments/initiate
Content-Type: application/json

{
  "bookingId": "BOOK-123",
  "amount": 500,
  "paymentMethod": "card", // mpesa, airtel, paypal, crypto, card
  "currency": "USD", // For PayPal, crypto, card
  "phoneNumber": "254712345678", // For M-Pesa, Airtel
  "returnUrl": "https://yourapp.com/success", // For PayPal
  "cancelUrl": "https://yourapp.com/cancel" // For PayPal
}
```

### Get Payment Status
```http
GET /api/payments/:paymentId/status
```

### Capture PayPal Payment
```http
POST /api/payments/paypal/:orderId/capture
```

---

## Production Deployment

### Checklist
- [ ] Switch all services to production mode
- [ ] Use production API credentials
- [ ] Configure production webhooks with HTTPS URLs
- [ ] Enable SSL/TLS certificates
- [ ] Set up rate limiting
- [ ] Configure logging and monitoring
- [ ] Test all payment flows end-to-end
- [ ] Set up fraud detection
- [ ] Configure refund policies
- [ ] Review compliance requirements (PCI DSS for cards)

### Security Best Practices
1. Never commit API keys to version control
2. Use environment variables for all credentials
3. Implement rate limiting on payment endpoints
4. Log all transactions securely
5. Encrypt sensitive data at rest
6. Use HTTPS for all API calls
7. Validate webhook signatures
8. Implement idempotency for retries
9. Monitor for suspicious activities
10. Regular security audits

### PCI Compliance for Card Payments
- Use Stripe Elements (already implemented)
- Never store raw card data
- Card data goes directly to Stripe
- Use HTTPS for all communications
- Regular security assessments

---

## Cost Estimates

### PayPal Fees
- **Domestic:** 2.9% + $0.30 per transaction
- **International:** 4.4% + fixed fee based on currency

### Stripe Fees
- **Standard cards:** 2.9% + $0.30 per transaction
- **International cards:** +1% additional
- **Currency conversion:** +1%

### Coinbase Commerce Fees
- **Cryptocurrency:** 1% per transaction
- **No monthly fees**

### M-Pesa & Airtel Money
- See PAYMENT_SETUP.md for local fees

---

## Troubleshooting

### PayPal Issues
- **"Invalid credentials":** Check client ID and secret match your environment
- **"Order not found":** Verify order ID in database
- **Webhook not firing:** Check webhook URL is publicly accessible

### Stripe Issues
- **"Invalid API key":** Ensure using correct test/live key
- **Card declined:** Use test cards in test mode
- **Webhook signature failed:** Verify webhook secret is correct

### Crypto Issues
- **"Invalid API key":** Regenerate API key in Coinbase Commerce
- **Charge expired:** Charges expire after 1 hour
- **Underpayment:** User didn't send exact amount (handle via resolve endpoint)

---

## Support

### PayPal Support
- Documentation: https://developer.paypal.com/docs/
- Support: https://developer.paypal.com/support/

### Stripe Support
- Documentation: https://stripe.com/docs
- Support: https://support.stripe.com/

### Coinbase Commerce Support
- Documentation: https://commerce.coinbase.com/docs/
- Support: https://help.coinbase.com/

---

## Additional Features

### Refunds
All payment providers support refunds:
- **PayPal:** Automated via API
- **Stripe:** Automated via API
- **Crypto:** Manual (contact customer)
- **M-Pesa:** Contact Safaricom

### Recurring Payments
- **Stripe:** Subscriptions API
- **PayPal:** Billing agreements
- **Crypto:** Not supported natively

### Multi-Currency Support
- **PayPal:** 100+ currencies
- **Stripe:** 135+ currencies
- **Crypto:** Any cryptocurrency supported by Coinbase

---

## Next Steps

1. Obtain API credentials from all providers
2. Update `.env` file with your credentials
3. Test each payment method in sandbox/test mode
4. Configure production webhooks
5. Deploy to production
6. Monitor transactions closely

For M-Pesa and Airtel Money setup, refer to the main `PAYMENT_SETUP.md` file.
