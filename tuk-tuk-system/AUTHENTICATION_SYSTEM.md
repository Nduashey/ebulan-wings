# EAA Go - Modern Authentication System

## Brand Identity
**Name:** EAA Go  
**Tagline:** Taxi & Cargo Services  
**Services:**
- 🚕 Tuk-Tuk Taxi
- 📦 Tuk-Tuk Cargo
- 🚐 Van Cargo
- 🔮 Future: Buses, Motorcycles, Delivery

## Authentication Features

### ✅ Implemented
1. **Phone-First Registration** (Primary Method)
   - OTP verification via SMS
   - 6-digit code, 10-minute expiration
   - Resend OTP functionality
   - Most user-friendly for African markets

2. **Email Registration** (Alternative)
   - OTP verification via email
   - Optional backup method

3. **JWT Token Authentication**
   - Access tokens (15 minutes)
   - Refresh tokens (7 days)
   - Secure session management

4. **Password Security**
   - bcrypt hashing (12 rounds)
   - Minimum 8 characters
   - Change password flow

5. **Multi-Step Registration**
   - Step 1: Enter phone number
   - Step 2: Verify OTP
   - Step 3: Complete profile (name, email, password)

### 🚀 Ready for Implementation
1. **Social Login** (Placeholders added)
   - Google OAuth
   - Facebook Login
   - Apple Sign In

2. **Decentralized Identity (Future)**
   - DID (Decentralized Identifiers)
   - SSI (Self-Sovereign Identity)
   - Blockchain-based verification
   - Can be added without breaking existing system

### SMS Integration Options
For production, integrate one of these African SMS providers:

1. **Africa's Talking** (Recommended for Kenya)
   ```bash
   npm install africastalking
   ```
   - Best coverage in East Africa
   - Competitive pricing
   - ~$0.01 per SMS

2. **Termii** (Nigeria)
   - Good for West Africa
   - Supports multiple channels

3. **Twilio** (International)
   - Global coverage
   - Higher pricing

## API Endpoints

### OTP Endpoints
```bash
# Send OTP to phone
POST http://localhost:3001/api/otp/send/phone
{
  "phone": "+254700123456"
}

# Send OTP to email
POST http://localhost:3001/api/otp/send/email
{
  "email": "user@example.com"
}

# Verify phone OTP
POST http://localhost:3001/api/otp/verify/phone
{
  "phone": "+254700123456",
  "code": "123456"
}

# Verify email OTP
POST http://localhost:3001/api/otp/verify/email
{
  "email": "user@example.com",
  "code": "123456"
}

# Resend OTP
POST http://localhost:3001/api/otp/resend
{
  "identifier": "+254700123456",
  "type": "phone"
}
```

### Auth Endpoints
```bash
# Register (after OTP verification)
POST http://localhost:3001/api/auth/register
{
  "phone": "+254700123456",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123!",
  "role": "PASSENGER"
}

# Login
POST http://localhost:3001/api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Get Profile
GET http://localhost:3001/api/auth/me
Authorization: Bearer <access_token>
```

## Registration Flow

### User Experience
1. **Landing Page** → Click "Register"
2. **Step 1: Phone Number**
   - Enter phone number
   - Alternative: Social login buttons (Google/Facebook)
3. **Step 2: OTP Verification**
   - Receive SMS with 6-digit code
   - Enter code
   - Option to resend if not received
4. **Step 3: Complete Profile**
   - First name, last name
   - Email (optional)
   - Password
   - Submit
5. **Auto-Login** → Dashboard

### Security Features
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ OTP expiration (10 minutes)
- ✅ One-time use OTPs
- ✅ Password hashing (bcrypt)
- ✅ JWT token expiration
- ✅ Session tracking (IP, User Agent)
- ✅ CORS protection
- ✅ Security headers (Helmet)

## Database Schema

### OTP Table
```sql
CREATE TABLE otps (
  id UUID PRIMARY KEY,
  phone VARCHAR,
  email VARCHAR,
  code VARCHAR NOT NULL,
  type ENUM (
    'PHONE_VERIFICATION',
    'EMAIL_VERIFICATION',
    'PASSWORD_RESET',
    'LOGIN_2FA'
  ),
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX (phone, code),
  INDEX (email, code)
);
```

### User Table (Updated)
- Phone verification status: `phoneVerified`
- Email verification status: `emailVerified`
- Support for phone-only accounts
- Email is optional

## Frontend Pages

### New: RegisterPage.tsx
- Material-UI stepper component
- 3-step registration flow
- Real-time validation
- Error handling
- Loading states
- Social login buttons (UI ready)

### Updated
- Header: "EAA Go" branding
- HomePage: Updated tagline and services
- Package.json: New package name

## Testing the System

### 1. Start Services
```bash
cd /home/nduasheym/EAA/tuk-tuk-system
./scripts/start-services.sh
./scripts/status-services.sh
```

### 2. Test OTP Flow
```bash
# Send OTP
curl -X POST http://localhost:3001/api/otp/send/phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"+254700123456"}'

# Check console/logs for OTP code
./scripts/logs.sh auth-service

# Verify OTP
curl -X POST http://localhost:3001/api/otp/verify/phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"+254700123456","code":"123456"}'
```

### 3. Test Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+254700123456",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "Test1234!",
    "role": "PASSENGER"
  }'
```

### 4. Access Frontend
- Open browser: http://localhost:3100
- Or use VS Code Simple Browser (already open)
- Click "Register" to test the flow

## Next Steps

### Immediate (Production-Ready Auth)
1. ✅ Phone OTP system - **DONE**
2. ✅ Multi-step registration UI - **DONE**
3. ⏳ Integrate real SMS provider (Africa's Talking)
4. ⏳ Add 2FA for login (optional security)
5. ⏳ Implement "Login with Phone" (OTP-based login)

### Short Term
1. Social login integration (Google/Facebook OAuth)
2. Driver-specific registration flow
3. Admin approval workflow
4. Email verification for password reset
5. Profile picture upload

### Future (Decentralized Identity)
1. DID integration for privacy
2. Blockchain-based verification
3. Zero-knowledge proofs
4. Portable identity across services

## Configuration

### Development
OTPs are logged to console:
```
🔐 OTP for +254700123456: 123456
```

### Production
Set up SMS provider in `.env`:
```env
# Africa's Talking
SMS_PROVIDER=africastalking
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_SENDER_ID=EAAGo

# Or Twilio
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

## User Roles

### Passenger (Default)
- Book rides
- Track drivers
- Make payments
- View history

### Driver (Requires Approval)
- Accept rides
- Navigate to pickup/destination
- Track earnings
- View ratings

### Admin
- Approve drivers
- Manage users
- View analytics
- Handle disputes

## Why This Approach?

### Phone-First Benefits
1. **Higher Completion Rate** - 70%+ vs 40% for email
2. **Instant Verification** - SMS arrives in seconds
3. **Universal Access** - Everyone has a phone number
4. **Lower Fraud** - Phone numbers harder to fake
5. **Better UX** - Familiar to African users

### Flexible for Future
- Easy to add DID/SSI later
- Social login ready
- Email as backup method
- Multi-factor auth support

## Success Metrics to Track
1. Registration completion rate
2. OTP delivery time
3. OTP success rate
4. SMS costs per user
5. Login success rate
6. Session duration
