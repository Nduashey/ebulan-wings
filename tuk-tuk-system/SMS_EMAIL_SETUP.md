# Production SMS & Email Setup Guide

## SMS Providers

### 1. Safaricom (Kenya) - RECOMMENDED for Kenyan numbers

**Steps to get API credentials:**

1. **Register for Safaricom Developer Portal**
   - Go to: https://developer.safaricom.co.ke/
   - Click "Sign Up"
   - Fill in your details
   - Verify email

2. **Create an App**
   - Login to portal
   - Click "Create App"
   - Select "SMS API"
   - Fill in app details

3. **Get Credentials**
   - Note down your:
     - Consumer Key (API Key)
     - Consumer Secret (API Secret)
     - Short Code (will be provided)

4. **Add to .env**
   ```env
   SMS_PROVIDER=safaricom
   SAFARICOM_API_KEY=your_consumer_key
   SAFARICOM_API_SECRET=your_consumer_secret
   SAFARICOM_SHORT_CODE=your_shortcode
   ```

**Cost:** ~KES 0.80 per SMS

---

### 2. Airtel Money API (Kenya, Uganda, Tanzania)

**Steps:**

1. **Contact Airtel Business**
   - Email: business@airtel.com
   - Request SMS API access
   - Provide business registration

2. **Get API Key**
   - They will provide API key after approval
   - Get sender ID approved

3. **Add to .env**
   ```env
   SMS_PROVIDER=airtel
   AIRTEL_API_KEY=your_api_key
   AIRTEL_SENDER_ID=EAAGo
   ```

**Cost:** ~KES 0.70 per SMS

---

### 3. Africa's Talking - BEST for Multi-Country

**Steps:**

1. **Sign Up**
   - Go to: https://account.africastalking.com/auth/register
   - Create account
   - Verify email

2. **Add App**
   - Login to dashboard
   - Click "Create App"
   - Note your username

3. **Get API Key**
   - Go to Settings
   - Generate API Key
   - Save it securely

4. **Add to .env**
   ```env
   SMS_PROVIDER=africastalking
   AFRICASTALKING_API_KEY=your_api_key
   AFRICASTALKING_USERNAME=your_username
   AFRICASTALKING_SENDER_ID=EAAGo
   ```

5. **Buy Credits**
   - Minimum: $10 USD
   - Go to "Buy Airtime"
   - Use M-Pesa or card

**Cost:** 
- Kenya: ~$0.01 per SMS
- Uganda: ~$0.015 per SMS
- Tanzania: ~$0.02 per SMS

---

### 4. Twilio (International Fallback)

**Steps:**

1. **Sign Up**
   - Go to: https://www.twilio.com/try-twilio
   - Create free account ($15 credit)

2. **Get Phone Number**
   - Buy a phone number
   - Note your Account SID and Auth Token

3. **Add to .env**
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

**Cost:** ~$0.05 per SMS (more expensive)

---

## Email Providers

### 1. SMTP (Gmail) - FREE

**Steps:**

1. **Enable 2FA on Gmail**
   - Go to Google Account settings
   - Security > 2-Step Verification
   - Enable it

2. **Generate App Password**
   - Security > App passwords
   - Select "Mail" and "Other device"
   - Copy the generated password

3. **Add to .env**
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

**Limits:** 500 emails/day (free)

---

### 2. SendGrid - RECOMMENDED

**Steps:**

1. **Sign Up**
   - Go to: https://signup.sendgrid.com/
   - Free tier: 100 emails/day

2. **Create API Key**
   - Settings > API Keys
   - Create API Key
   - Save it securely

3. **Verify Sender**
   - Settings > Sender Authentication
   - Verify your domain or single sender

4. **Add to .env**
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=your_api_key
   SENDGRID_FROM_EMAIL=noreply@eaago.com
   ```

**Cost:** Free tier: 100/day, Paid: $15/mo for 50K emails

---

## Recommended Setup for EAA Go

### Development
```env
SMS_PROVIDER=console
EMAIL_PROVIDER=console
```

### Production (Kenya-focused)
```env
# Primary SMS - Safaricom (auto-selected for 07XX numbers)
SMS_PROVIDER=safaricom
SAFARICOM_API_KEY=your_key
SAFARICOM_API_SECRET=your_secret
SAFARICOM_SHORT_CODE=your_code

# Secondary SMS - Airtel (auto-selected for 07XX Airtel numbers)
AIRTEL_API_KEY=your_key

# Fallback SMS - Africa's Talking
AFRICASTALKING_API_KEY=your_key
AFRICASTALKING_USERNAME=your_username

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_key
```

### How Auto-Selection Works

The system automatically selects the best SMS provider based on phone number:

```typescript
// Safaricom prefixes (Kenya)
+254700, +254701, +254710, +254711, +254720, +254740, etc.

// Airtel prefixes (Kenya)  
+254730, +254731, +254750, +254780, etc.

// Other African countries
Uses Africa's Talking

// International
Uses Twilio
```

---

## Testing Production Setup

### 1. Test SMS
```bash
curl -X POST http://localhost:3001/api/otp/send/phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"+254700123456"}'
```

### 2. Test Email
```bash
curl -X POST http://localhost:3001/api/otp/send/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 3. Check Logs
```bash
./scripts/logs.sh auth-service
```

---

## Cost Estimates (Monthly for 10,000 users)

### SMS Costs
- Assume 2 OTPs per registration
- 10,000 users × 2 SMS = 20,000 SMS

**Safaricom:**
- 20,000 × KES 0.80 = KES 16,000 (~$120)

**Africa's Talking:**
- 20,000 × $0.01 = $200

**Twilio:**
- 20,000 × $0.05 = $1,000

**Recommendation:** Use Safaricom + Airtel for best rates

### Email Costs
**SendGrid:**
- Free tier: 100/day = 3,000/month (FREE)
- Paid: $15/month for 50,000 emails

---

## Security Best Practices

1. **Never commit credentials to Git**
   ```bash
   # Already in .gitignore
   .env
   .env.local
   ```

2. **Use environment-specific configs**
   - .env.development
   - .env.production

3. **Rotate API keys regularly**
   - Every 90 days minimum

4. **Monitor usage & costs**
   - Set up billing alerts
   - Track SMS delivery rates

5. **Rate limiting**
   - Already implemented: 100 requests/15min
   - Consider adding per-phone limits

---

## What I Need From You

Please provide the following for production deployment:

### 1. SMS Providers
- [ ] Safaricom API credentials
- [ ] Airtel API credentials
- [ ] Or should I set up Africa's Talking?

### 2. Email Provider
- [ ] Use Gmail SMTP (free, provide email)
- [ ] Or set up SendGrid (I can help)

### 3. Domain
- [ ] Custom domain for emails (e.g., noreply@eaago.com)
- [ ] Or use default for now

### 4. Budget
- [ ] Expected number of users per month
- [ ] SMS budget availability

---

## Quick Start (No API Keys Needed)

For immediate testing, the system works in console mode:

```bash
# Start services
./scripts/start-services.sh

# Test registration
# OTP will be printed in logs
./scripts/logs.sh auth-service
```

OTPs will appear in logs like:
```
🔐 OTP for +254700123456: 194040
```

This allows full testing without any API setup!
