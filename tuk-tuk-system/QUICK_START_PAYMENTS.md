# Quick Start: Testing All Payment Methods

## Prerequisites
1. Install dependencies:
```bash
cd services/payment-service
npm install

cd ../../frontend
npm install
```

2. Set up database:
```bash
cd services/payment-service
npm run migrate # or start the service to auto-create tables
```

## Payment Method Test Guide

### 1. M-Pesa Testing 🇰🇪
**Credentials Needed:**
- M-Pesa Sandbox account: https://developer.safaricom.co.ke/

**Test Flow:**
```bash
# Request
POST http://localhost:3004/api/payments/initiate
{
  "bookingId": "BOOK-TEST-001",
  "amount": 100,
  "paymentMethod": "mpesa",
  "phoneNumber": "254708374149"
}

# Response
{
  "success": true,
  "data": {
    "paymentId": "PAY-ABC123",
    "checkoutRequestId": "ws_CO_..."
  }
}
```

**What happens:**
1. STK push sent to phone
2. User enters M-Pesa PIN
3. Webhook receives callback
4. Payment status updates to "completed"

**Test Phone:** `254708374149` (Safaricom sandbox)

---

### 2. Airtel Money Testing 🇰🇪
**Credentials Needed:**
- Contact Airtel Business for sandbox access

**Test Flow:**
```bash
POST http://localhost:3004/api/payments/initiate
{
  "bookingId": "BOOK-TEST-002",
  "amount": 100,
  "paymentMethod": "airtel",
  "phoneNumber": "254700123456"
}
```

---

### 3. PayPal Testing 💳
**Credentials Needed:**
- PayPal sandbox account: https://developer.paypal.com/

**Test Flow:**
```bash
POST http://localhost:3004/api/payments/initiate
{
  "bookingId": "BOOK-TEST-003",
  "amount": 50,
  "paymentMethod": "paypal",
  "currency": "USD",
  "returnUrl": "http://localhost:3000/payment/success",
  "cancelUrl": "http://localhost:3000/payment/cancel"
}

# Response includes approvalUrl
{
  "success": true,
  "data": {
    "paymentId": "PAY-XYZ789",
    "orderId": "8XH12345678901234",
    "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=..."
  }
}
```

**What happens:**
1. User redirects to `approvalUrl`
2. Logs in with PayPal sandbox account
3. Approves payment
4. Redirects back to your app
5. Call capture endpoint:
```bash
POST http://localhost:3004/api/payments/paypal/8XH12345678901234/capture
```

**Test Account:**
- Create sandbox buyer in PayPal Developer Dashboard
- Or use auto-generated test accounts

---

### 4. Cryptocurrency Testing ₿
**Credentials Needed:**
- Coinbase Commerce account: https://commerce.coinbase.com/

**Test Flow:**
```bash
POST http://localhost:3004/api/payments/initiate
{
  "bookingId": "BOOK-TEST-004",
  "amount": 25,
  "paymentMethod": "crypto",
  "currency": "USD"
}

# Response
{
  "success": true,
  "data": {
    "paymentId": "PAY-CRYPTO1",
    "chargeId": "abc123...",
    "chargeCode": "ABCD1234",
    "hostedUrl": "https://commerce.coinbase.com/charges/ABCD1234",
    "pricing": {
      "local": { "amount": "25.00", "currency": "USD" },
      "bitcoin": { "amount": "0.00054321", "currency": "BTC" },
      "ethereum": { "amount": "0.0123456", "currency": "ETH" }
    }
  }
}
```

**What happens:**
1. User redirects to `hostedUrl`
2. Selects cryptocurrency (BTC, ETH, USDC, etc.)
3. Sends payment to displayed address
4. Blockchain confirms transaction
5. Webhook updates payment status

**Test Mode:**
- Coinbase Commerce has test mode with simulated payments
- Or use testnet cryptocurrencies

---

### 5. Card Payment Testing 💳
**Credentials Needed:**
- Stripe account: https://stripe.com/

**Test Flow:**
```bash
POST http://localhost:3004/api/payments/initiate
{
  "bookingId": "BOOK-TEST-005",
  "amount": 30,
  "paymentMethod": "card",
  "currency": "USD"
}

# Response
{
  "success": true,
  "data": {
    "paymentId": "PAY-CARD1",
    "clientSecret": "pi_xxx_secret_yyy",
    "publishableKey": "pk_test_..."
  }
}
```

**Frontend (React):**
```javascript
// Use Stripe Elements
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripe = await loadStripe(publishableKey);

// User enters card details in CardElement
// Confirm payment
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});
```

**Test Cards:**
```
Success:           4242 4242 4242 4242
3D Secure:         4000 0025 0000 3155
Declined:          4000 0000 0000 9995
Insufficient funds: 4000 0000 0000 9995
```
- Any future expiry (e.g., 12/25)
- Any 3-digit CVC (e.g., 123)

---

## Check Payment Status

For all payment methods:
```bash
GET http://localhost:3004/api/payments/PAY-ABC123/status

# Response
{
  "success": true,
  "data": {
    "paymentId": "PAY-ABC123",
    "bookingId": "BOOK-TEST-001",
    "status": "completed", // pending, processing, completed, failed
    "amount": 100,
    "currency": "KES",
    "paymentMethod": "mpesa",
    "transactionId": "MPESA123456",
    "createdAt": "2024-02-18T10:30:00Z",
    "completedAt": "2024-02-18T10:31:00Z"
  }
}
```

---

## Webhook Testing with ngrok

### Setup ngrok
```bash
# Install ngrok
npm install -g ngrok

# Start payment service
cd services/payment-service
npm run dev

# In another terminal, expose port 3004
ngrok http 3004

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

### Configure Webhooks
Update webhook URLs in provider dashboards:

**M-Pesa:**
```
https://abc123.ngrok.io/api/payments/mpesa/callback
```

**Airtel:**
```
https://abc123.ngrok.io/api/payments/airtel/callback
```

**PayPal:**
```
https://abc123.ngrok.io/api/payments/paypal/webhook
```

**Stripe:**
```
https://abc123.ngrok.io/api/payments/stripe/webhook
```

**Coinbase Commerce:**
```
https://abc123.ngrok.io/api/payments/crypto/webhook
```

---

## Frontend Testing

### Start Frontend
```bash
cd frontend
npm start
# Opens http://localhost:3000
```

### Navigate to Payment Page
```
http://localhost:3000/payment/:bookingId
```

### Test Complete Flow
1. Select payment method
2. Enter amount and details
3. Complete payment:
   - **M-Pesa/Airtel:** Wait for STK push
   - **Card:** Enter test card in Stripe Elements
   - **PayPal:** Redirect and approve
   - **Crypto:** Redirect and send crypto
4. View success/failure message

---

## Environment Setup

### Minimum `.env` for Testing
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eaa_db
DB_USER=eaa_user
DB_PASSWORD=eaa_password

# Service
PAYMENT_SERVICE_PORT=3004
NODE_ENV=development

# M-Pesa Sandbox
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_key_here
MPESA_CONSUMER_SECRET=your_secret_here
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://your-ngrok.ngrok.io/api/payments/mpesa/callback

# Stripe Test
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
STRIPE_ENV=test

# PayPal Sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=your_webhook_id

# Coinbase Commerce
COINBASE_COMMERCE_API_KEY=your_api_key
COINBASE_COMMERCE_WEBHOOK_SECRET=your_webhook_secret

# URLs
BOOKING_SERVICE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

---

## Common Issues & Solutions

### Issue: "Database connection failed"
**Solution:**
```bash
# Ensure PostgreSQL is running
sudo systemctl start postgresql

# Create database
psql -U postgres
CREATE DATABASE eaa_db;
CREATE USER eaa_user WITH PASSWORD 'eaa_password';
GRANT ALL PRIVILEGES ON DATABASE eaa_db TO eaa_user;
```

### Issue: "M-Pesa STK push timeout"
**Solution:**
- Verify phone number format: `254XXXXXXXXX`
- Check callback URL is publicly accessible (use ngrok)
- Verify credentials are correct

### Issue: "Stripe card declined"
**Solution:**
- Use test card numbers only in test mode
- Check Stripe dashboard for decline reason
- Verify publishable/secret keys match environment

### Issue: "Webhook not received"
**Solution:**
- Ensure ngrok is running
- Check webhook URL is correct in provider dashboard
- Verify webhook secret matches
- Check server logs for incoming requests

---

## Quick Test Checklist

- [ ] Database created and running
- [ ] `.env` file configured with test credentials
- [ ] Payment service running on port 3004
- [ ] Frontend running on port 3000
- [ ] ngrok exposing payment service
- [ ] Webhook URLs configured in all providers
- [ ] Test M-Pesa payment ✅
- [ ] Test Airtel payment ✅
- [ ] Test PayPal payment ✅
- [ ] Test Crypto payment ✅
- [ ] Test Card payment ✅
- [ ] Verify webhooks received ✅
- [ ] Check database updates ✅

---

## Getting API Credentials

### PayPal (5 minutes)
1. Go to https://developer.paypal.com/
2. Sign in or create account
3. Dashboard → Apps & Credentials → Create App
4. Copy Client ID and Secret from "Sandbox" tab

### Stripe (5 minutes)
1. Go to https://stripe.com/
2. Sign up for account
3. Developers → API Keys
4. Copy Publishable Key and Secret Key

### Coinbase Commerce (10 minutes)
1. Go to https://commerce.coinbase.com/
2. Sign up and verify email
3. Settings → API Keys → Create an API Key
4. Copy and save immediately (can't view again)

### M-Pesa (1-2 days)
1. Go to https://developer.safaricom.co.ke/
2. Sign up and verify email
3. Create app → Get credentials
4. Note: Live credentials require business verification

### Airtel (2-7 days)
1. Contact Airtel Business at business@airtel.com
2. Request API access
3. Complete KYC process
4. Receive credentials via email

---

## Next Steps

1. ✅ Get test credentials from each provider
2. ✅ Update `.env` file
3. ✅ Start payment service
4. ✅ Test each payment method
5. ✅ Verify webhooks work
6. ✅ Test frontend integration
7. 🚀 Deploy to production when ready

**Need help?** Check:
- `EXTENDED_PAYMENT_METHODS.md` - Detailed setup guide
- `PAYMENT_IMPLEMENTATION_COMPLETE.md` - Technical documentation
- Provider documentation links above
