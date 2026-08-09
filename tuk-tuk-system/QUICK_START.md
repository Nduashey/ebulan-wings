# Quick Start Guide - Ebulan Wings Tuk Tuk System

## 🚀 Start All Services

```bash
docker compose up -d
```

## ✅ Verify Services

```bash
# Check all services are running
docker compose ps

# Check health endpoints
curl http://localhost:3000/health  # Client Gateway
curl http://localhost:3010/health  # Admin Gateway
curl http://localhost:3002/health  # Booking Service
```

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3100 | Public user interface |
| **Guest Booking** | http://localhost:3100/guest/booking | Booking without login |
| **Client API** | http://localhost:3000 | Public API gateway |
| **Admin API** | http://localhost:3010 | Admin-only gateway (requires JWT) |

## 📝 Test Booking

### Using the UI
1. Open http://localhost:3100/guest/booking
2. Fill in the form:
   - Service Type: Taxi / Cargo / Delivery / Airport
   - Pickup Location: Any address
   - Dropoff Location: Any address
   - Phone: Any valid number
   - Date & Time: Select future date/time
3. Click "Book Now"
4. ✅ You should see success message with booking ID

### Using curl
```bash
curl -X POST http://localhost:3000/api/bookings/guest \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "taxi",
    "pickupLocation": "Airport Terminal 1",
    "dropoffLocation": "City Center Hotel",
    "passengerName": "John Doe",
    "phone": "1234567890",
    "scheduledDate": "2026-02-20",
    "scheduledTime": "10:30"
  }'
```

## 🔐 Admin Access

Admin endpoints require JWT token with admin role:

```bash
# 1. Get admin token (if you have admin user)
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ebulan.com","password":"your-password"}' \
  | jq -r '.token')

# 2. Access admin endpoint
curl http://localhost:3010/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

## 🛑 Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v
```

## 📊 View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f booking-service
docker compose logs -f api-gateway
docker compose logs -f admin-gateway
docker compose logs -f frontend
```

## 🔧 Rebuild After Code Changes

```bash
# Rebuild specific service
docker compose build booking-service

# Rebuild and restart
docker compose up -d --build booking-service

# Rebuild everything
docker compose build
docker compose up -d
```

## 📱 Service Ports

| Port | Service | Access Level |
|------|---------|--------------|
| 3000 | Client API Gateway | Public |
| 3001 | Auth Service | Internal |
| 3002 | Booking Service | Internal |
| 3003 | Driver Service | Internal |
| 3004 | Payment Service | Internal |
| 3005 | Notification Service | Internal |
| 3006 | Location Service | Internal |
| 3010 | Admin API Gateway | Private (JWT required) |
| 3100 | Frontend | Public |
| 5432 | PostgreSQL | Internal |
| 27017 | MongoDB | Internal |
| 6379 | Redis | Internal |
| 5672 | RabbitMQ | Internal |

## 🐛 Troubleshooting

### Validation Error in UI
✅ **Fixed!** Added `passengerName` field to validation schema

### Service Not Starting
```bash
# Check logs
docker compose logs [service-name]

# Restart specific service
docker compose restart [service-name]

# Rebuild if code changed
docker compose build [service-name]
docker compose up -d [service-name]
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Recreate database
docker compose down
docker compose up -d postgres
```

### Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 [PID]

# Or change port in docker-compose.yml
```

## 📚 Documentation

- [Admin Gateway Setup](./ADMIN_GATEWAY_SETUP.md) - Production deployment guide
- [Validation Fix Summary](./VALIDATION_FIX_SUMMARY.md) - Recent fixes
- [Booking System](./BOOKING_PERSISTENCE_RECEIPTS.md) - Booking features
- [Authentication](./REGISTRATION_LOGIN_COMPLETE.md) - User auth system

## 🎯 Common Tasks

### Create a Booking
See "Test Booking" section above

### Download Receipt
```bash
# After creating booking, get receipt
BOOKING_ID="EBW-XXXXXXXX"

# PDF format
curl http://localhost:3000/api/bookings/$BOOKING_ID/receipt?format=pdf \
  --output receipt.pdf

# TXT format
curl http://localhost:3000/api/bookings/$BOOKING_ID/receipt?format=txt
```

### View All Bookings (Admin)
```bash
curl http://localhost:3010/api/bookings \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Update Booking Status (Admin)
```bash
curl -X PATCH http://localhost:3010/api/bookings/$BOOKING_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

## ✨ Features

- ✅ Guest booking (no login required)
- ✅ Member booking (with account)
- ✅ PDF receipt generation
- ✅ TXT receipt download
- ✅ Database persistence
- ✅ Booking history for members
- ✅ Admin dashboard access
- ✅ Separate admin gateway for security
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CORS protection

## 🚀 Production Deployment

See [ADMIN_GATEWAY_SETUP.md](./ADMIN_GATEWAY_SETUP.md) for:
- Kubernetes deployment
- Ingress configuration
- Network policies
- Monitoring setup
- Security best practices

---

**Need Help?** Check the logs first: `docker compose logs -f`
