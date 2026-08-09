# Payment Service Setup Guide

This guide will help you integrate M-Pesa and Airtel Money STK push payments into the EAA Tuk-Tuk system.

## Overview

The payment service supports:
- **M-Pesa STK Push** (Safaricom Kenya)
- **Airtel Money STK Push** (Airtel Kenya/Uganda/Tanzania)
- Real-time payment status updates
- Automated booking service integration
- Transaction verification and callbacks

## Prerequisites

Before setting up the payment service, you need to obtain API credentials from both providers.

---

## M-Pesa Setup (Safaricom Daraja API)

### 1. Create M-Pesa Daraja Account

1. Visit [Safaricom Daraja Portal](https://developer.safaricom.co.ke/)
2. Click "Sign Up" and create an account
3. Verify your email address
4. Log in to your dashboard

### 2. Create an App

1. Click "My Apps" in the dashboard
2. Click "Add a New App"
3. Select "Lipa Na M-Pesa Online"
4. Fill in the app details:
   - **App Name**: EAA Tuk-Tuk Payments
   - **Description**: Payment processing for tuk-tuk services
5. Click "Create App"

### 3. Get Your Credentials

After creating the app, you'll receive:
- **Consumer Key** - Used for authentication
- **Consumer Secret** - Used for authentication
- **Business Short Code** - Your paybill/till number
- **Passkey** - Lipa Na M-Pesa Online passkey

**Sandbox Credentials (for testing):**
- Business Short Code: `174379`
- Passkey: Will be provided in the Daraja portal test credentials

### 4. Register Callback URLs

You need to register your callback URLs with Safaricom:

**Production:**
```
https://yourdomain.com/api/payments/mpesa/callback
```

**Development (using ngrok for local testing):**
```bash
# Install ngrok
npm install -g ngrok

# Start your payment service
npm run dev

# In another terminal, expose port 3004
ngrok http 3004

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use: https://abc123.ngrok.io/api/payments/mpesa/callback
```

### 5. Environment Variables

Add to your `.env` file:

```bash
# M-Pesa Configuration
MPESA_ENV=sandbox                  # or 'production'
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_BUSINESS_SHORT_CODE=174379   # Your paybill/till number
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
```

### M-Pesa Test Numbers

For testing in sandbox:
- Phone: `254708374149` (Test M-Pesa number)
- Amount: Any amount between 1-70,000 KES
- PIN: Enter any 4-digit PIN in the test prompt

---

## Airtel Money Setup

### 1. Contact Airtel Business

1. Email: [business@airtel.com](mailto:business@airtel.com)
2. Request: Airtel Money API integration for your business
3. Provide:
   - Business name and registration details
   - Use case (tuk-tuk payment processing)
   - Expected transaction volume

### 2. Complete Onboarding

Airtel will guide you through:
- Business verification
- KYC documentation
- API sandbox access
- Production credentials

### 3. Get Your Credentials

You'll receive:
- **Client ID** - OAuth authentication
- **Client Secret** - OAuth authentication
- **API Key** - Request authentication

### 4. Register Callback URL

Provide your callback URL to Airtel:

**Production:**
```
https://yourdomain.com/api/payments/airtel/callback
```

**Development:**
```
https://abc123.ngrok.io/api/payments/airtel/callback
```

### 5. Environment Variables

Add to your `.env` file:

```bash
# Airtel Money Configuration
AIRTEL_ENV=sandbox                     # or 'production'
AIRTEL_CLIENT_ID=your_client_id_here
AIRTEL_CLIENT_SECRET=your_client_secret_here
AIRTEL_API_KEY=your_api_key_here
AIRTEL_CALLBACK_URL=https://yourdomain.com/api/payments/airtel/callback
```

### Airtel Test Numbers

For testing in sandbox:
- Contact Airtel for test credentials
- They provide specific test phone numbers
- Test transactions don't deduct real money

---

## Installation

### 1. Install Dependencies

```bash
cd services/payment-service
npm install
```

### 2. Set Up Environment Variables

Create `.env` file in `services/payment-service/`:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=eaa_db
DB_USER=eaa_user
DB_PASSWORD=eaa_password

# Service
PORT=3004
LOG_LEVEL=info

# Booking Service Integration
BOOKING_SERVICE_URL=http://booking-service:3002

# M-Pesa
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback

# Airtel Money
AIRTEL_ENV=sandbox
AIRTEL_CLIENT_ID=your_client_id
AIRTEL_CLIENT_SECRET=your_client_secret
AIRTEL_API_KEY=your_api_key
AIRTEL_CALLBACK_URL=https://yourdomain.com/api/payments/airtel/callback
```

### 3. Run Database Migrations

```bash
npm run migrate
```

### 4. Start the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

---

## API Endpoints

### Initiate Payment

```http
POST /api/payments/initiate
Content-Type: application/json

{
  "bookingId": "BOOK-12345",
  "amount": 500,
  "paymentMethod": "mpesa",
  "phoneNumber": "254712345678",
  "userId": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "paymentId": "PAY-ABC12345",
  "provider": "mpesa",
  "data": {
    "MerchantRequestID": "...",
    "CheckoutRequestID": "...",
    "ResponseCode": "0",
    "ResponseDescription": "Success",
    "CustomerMessage": "Success. Request accepted for processing"
  }
}
```

### Check Payment Status

```http
GET /api/payments/{paymentId}/status
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "paymentId": "PAY-ABC12345",
    "bookingId": "BOOK-12345",
    "amount": 500,
    "status": "completed",
    "provider": "mpesa",
    "transactionId": "NLJ7RT61SV",
    "createdAt": "2026-02-18T10:30:00Z",
    "completedAt": "2026-02-18T10:31:00Z"
  }
}
```

### Get Booking Payments

```http
GET /api/payments/booking/{bookingId}
```

---

## Testing

### Test M-Pesa Payment

1. Start the payment service:
```bash
npm run dev
```

2. Use the sandbox test number:
```json
{
  "bookingId": "BOOK-TEST-001",
  "amount": 100,
  "paymentMethod": "mpesa",
  "phoneNumber": "254708374149"
}
```

3. You'll receive a simulated STK push prompt
4. Enter any 4-digit PIN
5. Payment will be processed

### Test Airtel Payment

1. Use Airtel test credentials
2. Follow same process as M-Pesa
3. Use Airtel-provided test numbers

---

## Payment Flow

1. **Customer initiates payment** → Frontend calls `/api/payments/initiate`
2. **STK push sent** → Customer receives mobile prompt
3. **Customer enters PIN** → Completes payment on their phone
4. **Callback received** → M-Pesa/Airtel sends confirmation
5. **Status updated** → Payment marked as completed
6. **Booking updated** → Booking service is notified

---

## Troubleshooting

### M-Pesa Issues

**Error: "Invalid Access Token"**
- Check your Consumer Key and Secret
- Verify you're using the correct environment (sandbox/production)

**Error: "Invalid Shortcode"**
- Confirm Business Short Code matches your app
- Ensure you're using the test shortcode in sandbox

**STK push not received**
- Verify phone number format (254XXXXXXXXX)
- Check that the phone is M-Pesa registered
- Ensure callback URL is accessible (use ngrok for local testing)

### Airtel Issues

**Error: "Authentication failed"**
- Verify Client ID and Secret
- Check API Key is correct

**Callback not received**
- Ensure callback URL is HTTPS
- Verify URL is registered with Airtel
- Check firewall settings

### General Issues

**Database connection error**
- Verify PostgreSQL is running
- Check database credentials in `.env`

**Callback timeout**
- Mobile money transactions can take 30-60 seconds
- Frontend polls for status every 3 seconds
- Don't close the payment page prematurely

---

## Production Checklist

Before going live:

- [ ] Obtain production M-Pesa credentials
- [ ] Obtain production Airtel credentials
- [ ] Set up production callback URLs (HTTPS)
- [ ] Update environment variables to production
- [ ] Test with real phone numbers
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting
- [ ] Set up transaction logging
- [ ] Implement retry logic for failed callbacks
- [ ] Set up backup notification system

---

## Support

- **M-Pesa Support**: [darajasupport@safaricom.co.ke](mailto:darajasupport@safaricom.co.ke)
- **Airtel Support**: [business@airtel.com](mailto:business@airtel.com)
- **Documentation**: Check `README.md` in payment-service directory

---

## Cost Estimates

### M-Pesa
- **Transaction Fee**: ~1.5% - 3% per transaction
- **API Calls**: Free
- **Minimum**: No monthly fees

### Airtel Money
- **Transaction Fee**: ~1.5% - 3% per transaction
- **Setup Fee**: May apply (contact Airtel)
- **Monthly Fee**: Varies by volume

**Note**: Fees vary by business type and volume. Contact providers for exact rates.
