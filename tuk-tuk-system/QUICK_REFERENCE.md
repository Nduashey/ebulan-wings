# EAA Tuk-Tuk System - Quick Reference

## 🌐 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Client Frontend** | http://localhost:3100 | Public users (Member/Guest) |
| **Admin Frontend** | http://localhost:3200 | Admin management panel |
| **Client API** | http://localhost:3000 | Public API endpoints |
| **Admin API** | http://localhost:3010 | Admin API (JWT required) |

## ⚙️ Common Commands

```bash
# Check all services
./scripts/check.sh

# Stop all services
./scripts/stop.sh

# Rebuild specific service
docker compose build frontend
docker compose up -d frontend

# View logs
docker compose logs -f frontend
docker compose logs -f booking-service

# Restart single service
docker compose restart frontend
```

## 🧪 Test Booking API

```bash
curl -X POST http://localhost:3000/api/bookings/guest \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "taxi",
    "pickupLocation": "Airport",
    "dropoffLocation": "Hotel",
    "passengerName": "John Doe",
    "phone": "+254700123456",
    "scheduledDate": "2026-02-20",
    "scheduledTime": "14:30"
  }'
```

## 📁 Key Files

| File | Description |
|------|-------------|
| `frontend/src/pages/HomePage.tsx` | Client landing page (NO admin button) |
| `frontend/src/pages/guest/GuestBookingPage.tsx` | Guest booking form (HAS passengerName) |
| `admin-frontend/src/pages/LoginPage.tsx` | Admin login |
| `admin-frontend/src/pages/BookingsPage.tsx` | Admin bookings view |
| `scripts/check.sh` | Service status checker |
| `scripts/stop.sh` | Stop all services |

## ✅ What's Fixed

- ✅ Booking form has `passengerName` field
- ✅ Admin button removed from client homepage
- ✅ Scripts include admin-frontend and admin-gateway
- ✅ Validation working correctly
- ✅ All services running

## 🔄 Hard Refresh

- **Brave/Chrome**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R` or `Ctrl + F5`

---

See [FINAL_FIX_SUMMARY.md](FINAL_FIX_SUMMARY.md) for detailed changes.
