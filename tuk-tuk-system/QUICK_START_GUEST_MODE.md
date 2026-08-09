# 🚀 Quick Start Guide - Guest Mode & Booking System

## Step 1: Start the Services

\`\`\`bash
# Navigate to project directory
cd /home/nduasheym/EAA/tuk-tuk-system

# Build and start all containers
docker-compose up --build -d

# Or start specific services
docker-compose up -d postgres booking-service api-gateway frontend
\`\`\`

## Step 2: Verify Services are Running

\`\`\`bash
# Check service health
docker-compose ps

# Expected output:
# - postgres (healthy)
# - booking-service (up)
# - api-gateway (up)
# - frontend (up)

# Test booking service
curl http://localhost:3002/health

# Test API gateway
curl http://localhost:3000/health
\`\`\`

## Step 3: Access the Application

Open your browser and navigate to:
- **Main App**: http://localhost:3100
- **Guest Landing**: http://localhost:3100/ (default route)
- **Booking Page**: http://localhost:3100/guest/booking

## Step 4: Test Guest Booking

### Via UI:
1. Go to http://localhost:3100
2. Click "Continue as Guest"
3. Select a service type (Taxi, Cargo, Delivery, or Airport)
4. Fill in booking details:
   - Pickup: Jomo Kenyatta Airport
   - Drop-off: Nairobi CBD
   - Phone: +254700123456
   - Date & Time: Select future date/time
5. Click "Confirm Booking"
6. Save your Booking ID (e.g., EBW-A3F2B5C8)

### Via API (cURL):
\`\`\`bash
curl -X POST http://localhost:3000/api/bookings/guest \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "taxi",
    "pickupLocation": "Jomo Kenyatta Airport",
    "dropoffLocation": "Nairobi CBD",
    "phone": "+254700123456",
    "scheduledDate": "2026-02-15",
    "scheduledTime": "14:30",
    "notes": "Please call on arrival",
    "isGuest": true
  }'
\`\`\`

## Step 5: View Booking (Admin)

### Access Admin Panel:
1. Login as admin (if authentication is set up)
2. Navigate to: http://localhost:3100/admin/bookings
3. View all bookings with filters

### Via API:
\`\`\`bash
# Get all bookings
curl http://localhost:3000/api/bookings

# Get specific booking
curl http://localhost:3000/api/bookings/EBW-A3F2B5C8

# Update booking status
curl -X PATCH http://localhost:3000/api/bookings/EBW-A3F2B5C8/status \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
\`\`\`

## Step 6: Check Database

\`\`\`bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U eaa_user -d eaa_db

# View all bookings
SELECT booking_id, service_type, status, phone, created_at 
FROM bookings 
ORDER BY created_at DESC;

# Count guest vs user bookings
SELECT is_guest, COUNT(*) 
FROM bookings 
GROUP BY is_guest;

# Exit psql
\q
\`\`\`

## Step 7: View Logs

\`\`\`bash
# Booking service logs
docker-compose logs -f booking-service

# All services
docker-compose logs -f

# Specific time range
docker-compose logs --since 10m booking-service
\`\`\`

## Troubleshooting

### Issue: Can't connect to booking service

\`\`\`bash
# Check if container is running
docker-compose ps booking-service

# Restart service
docker-compose restart booking-service

# View detailed logs
docker-compose logs --tail=100 booking-service
\`\`\`

### Issue: Database connection failed

\`\`\`bash
# Check PostgreSQL health
docker-compose ps postgres

# Test database connection
docker-compose exec postgres pg_isready -U eaa_user

# Restart database
docker-compose restart postgres
\`\`\`

### Issue: Frontend shows API errors

\`\`\`bash
# Verify API gateway is running
curl http://localhost:3000/health

# Check CORS settings in docker-compose.yml
# Ensure frontend URL is in CORS_ORIGINS

# Check browser console for errors
\`\`\`

## Development Mode

### Run booking service locally (without Docker):

\`\`\`bash
# Install dependencies
cd services/booking-service
npm install

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=eaa_db
export DB_USER=eaa_user
export DB_PASSWORD=eaa_password
export PORT=3002

# Run in development mode
npm run dev
\`\`\`

### Run frontend locally:

\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

## Production Deployment

\`\`\`bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start in production mode
docker-compose -f docker-compose.prod.yml up -d

# Monitor
docker-compose -f docker-compose.prod.yml logs -f
\`\`\`

## API Testing with Postman

### Collection available at:
`docs/postman/Ebulan-Wings-Booking-API.json`

### Test endpoints:
1. Create Guest Booking
2. Get Booking by ID
3. List All Bookings
4. Update Booking Status
5. Filter by Service Type
6. Filter by Status

## Performance Tips

1. **Database Indexing**: Already optimized with indexes on booking_id, user_id, status
2. **Connection Pooling**: PostgreSQL pool configured for optimal performance
3. **Caching**: Consider adding Redis for frequently accessed bookings
4. **Rate Limiting**: Configured in API Gateway

## Security Checklist

- [x] Input validation (Joi schemas)
- [x] SQL injection prevention (parameterized queries)
- [x] CORS protection
- [x] Rate limiting
- [x] Environment variables for secrets
- [ ] HTTPS/SSL (configure in production)
- [ ] API authentication/authorization
- [ ] Request logging and monitoring

## Next Steps

1. **Test all service types**: Taxi, Cargo, Delivery, Airport
2. **Test edge cases**: Invalid dates, malformed phone numbers
3. **Load testing**: Use Apache Bench or Artillery
4. **Monitor metrics**: Set up Prometheus + Grafana
5. **Add notifications**: SMS/Email for booking confirmations

## Support

Need help? Check:
- Full documentation: `GUEST_MODE_IMPLEMENTATION.md`
- API docs: `docs/api/booking-service.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`

---

**Ready to scale! 🚀**
