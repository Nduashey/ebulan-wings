# Guest Mode & Booking System Implementation

## 🎉 Overview

This document describes the complete **Guest Mode** and **Booking System** implementation for Ebulan Wings. The system allows users to book services without registration while maintaining the option to create accounts for enhanced features.

## ✨ Features Implemented

### 1. Guest Landing Page (`/`)
- **Minimalistic black & yellow theme** matching Ebulan Wings branding
- **No authentication required** - instant access to services
- **Four service types**:
  - 🚕 Taxi Services (Tuk-tuks & cars)
  - 📦 Cargo Transport
  - 🛵 Delivery Services
  - ✈️ Airport Transfers
- **Quick actions**:
  - Continue as Guest (instant booking)
  - Login (existing users)
  - Register (new accounts)

### 2. Guest Booking System (`/guest/booking`)
- **Interactive service selection** with toggle cards
- **Complete booking form**:
  - Service type (taxi, cargo, delivery, airport)
  - Pickup & drop-off locations
  - Contact phone number
  - Schedule (date & time)
  - Additional notes (optional)
- **Real-time validation**
- **Instant booking confirmation** with unique Booking ID
- **No history tracking** - perfect for privacy-conscious users

### 3. Production-Grade Backend

#### Booking Service (`services/booking-service`)
- **RESTful API** with Express.js & TypeScript
- **PostgreSQL database** with optimized indexes
- **Comprehensive validation** using Joi
- **Error handling & logging** with Winston
- **Dockerized** for easy deployment

#### API Endpoints:
```
POST   /api/bookings/guest         - Create guest booking
GET    /api/bookings/:bookingId    - Get booking details
GET    /api/bookings               - List all bookings (admin)
PATCH  /api/bookings/:bookingId/status - Update booking status
```

### 4. Admin Management Interface

#### Bookings Management (`/admin/bookings`)
- **Real-time booking overview**
- **Advanced filtering**:
  - By status (pending, confirmed, in-progress, completed, cancelled)
  - By service type
  - By search term (booking ID, phone, location)
- **Status management** with one-click updates
- **Detailed booking view** with full information
- **Guest vs User differentiation**

## 🎨 Design Theme

### Color Palette
- **Primary**: `#FFB800` (Yellow/Orange - brand color)
- **Background**: `#000000` (Black)
- **Cards**: `#1a1a1a` (Dark gray)
- **Borders**: `#333333` (Medium gray)
- **Text**: `#FFFFFF` (White)
- **Secondary accents**: `#FF9800`, `#FF5722`, `#FFC107`

### UI Principles
- **Minimalistic** - clean, distraction-free interface
- **Toggle actions** - interactive service cards
- **High contrast** - excellent readability
- **Responsive** - works on all devices
- **Accessible** - proper ARIA labels and keyboard navigation

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Backend - Booking Service
cd services/booking-service
npm install

# Frontend
cd ../../frontend
npm install
```

### 2. Build & Start Services

```bash
# From project root
docker-compose up --build

# Or start individually
# Booking service
cd services/booking-service
npm run dev

# Frontend
cd frontend
npm start
```

### 3. Access the Application

- **Frontend**: http://localhost:3100
- **API Gateway**: http://localhost:3000
- **Booking Service**: http://localhost:3002
- **Database**: PostgreSQL on localhost:5432

## 📊 Database Schema

```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(255) UNIQUE NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  phone VARCHAR(50) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  notes TEXT,
  is_guest BOOLEAN DEFAULT false,
  user_id INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  estimated_price DECIMAL(10, 2),
  actual_price DECIMAL(10, 2),
  driver_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_booking_id ON bookings(booking_id);
CREATE INDEX idx_user_id ON bookings(user_id);
CREATE INDEX idx_status ON bookings(status);
CREATE INDEX idx_created_at ON bookings(created_at);
```

## 🔄 User Flow

### Guest Booking Flow
1. User visits landing page (`/`)
2. Clicks "Continue as Guest"
3. Selects service type
4. Fills in booking details
5. Submits booking
6. Receives unique Booking ID (e.g., `EBW-A3F2B5C8`)
7. Can track booking using ID (no account needed)

### Registered User Flow
1. User registers/logs in
2. Access full dashboard with history
3. Book services with saved preferences
4. View all past bookings
5. Earn rewards and track loyalty points

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React +      │
│   Material-UI)  │
└────────┬────────┘
         │
         │ HTTP/REST
         ▼
┌─────────────────┐
│   API Gateway   │
│   (Express)     │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│ Auth Service │  │ Booking      │
│              │  │ Service      │
└──────────────┘  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  PostgreSQL  │
                  │  Database    │
                  └──────────────┘
```

## 🔐 Security Features

- **Input validation** on both frontend and backend
- **SQL injection prevention** with parameterized queries
- **Rate limiting** via API Gateway
- **CORS protection** with whitelisted origins
- **Phone number validation** with regex
- **Date/time validation** to prevent past bookings

## 📱 Service Types

### 1. Taxi Services (🚕)
- Tuk-tuks for city travel
- Quick rides within urban areas
- Affordable rates

### 2. Cargo Transport (📦)
- Move goods and packages
- Various vehicle sizes
- Secure handling

### 3. Delivery Services (🛵)
- Fast and reliable delivery
- Real-time tracking
- Flexible scheduling

### 4. Airport Transfers (✈️)
- Comfortable pickup/drop-off
- Pre-scheduled service
- Luggage assistance

## 🎯 Benefits of Guest Mode

✅ **Instant Access** - No registration required
✅ **Privacy First** - No history tracking
✅ **Quick Bookings** - Simplified 3-step process
✅ **No Commitment** - Try before creating account
✅ **Mobile Friendly** - Responsive design

## 📈 Future Enhancements

- [ ] Real-time driver tracking
- [ ] Push notifications for booking updates
- [ ] Multiple payment gateway integration
- [ ] Booking modification/cancellation
- [ ] Driver rating system
- [ ] Promotional codes/discounts
- [ ] Multi-language support
- [ ] SMS notifications
- [ ] Booking history export (for registered users)
- [ ] Advanced analytics dashboard

## 🐛 Troubleshooting

### Booking Service won't start
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs booking-service

# Restart service
docker-compose restart booking-service
```

### Database connection issues
```bash
# Ensure DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
docker-compose exec postgres psql -U eaa_user -d eaa_db -c "SELECT 1;"
```

### Frontend can't reach API
- Verify API Gateway is running on port 3000
- Check CORS settings in docker-compose.yml
- Ensure REACT_APP_API_URL is set correctly

## 📞 Support

For issues or questions:
- Email: support@ebulanwings.com
- GitHub: [Repository Issues](https://github.com/ebulan-wings/issues)
- Slack: #ebulan-wings-support

## 📄 License

Copyright © 2026 Ebulan Wings. All rights reserved.

---

**Built with ❤️ using React, TypeScript, Express.js, and PostgreSQL**
