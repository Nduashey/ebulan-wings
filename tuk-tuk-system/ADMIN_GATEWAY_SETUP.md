# Admin Gateway - Production-Grade Setup

## Overview

The Tuk Tuk System now has **TWO SEPARATE API GATEWAYS** for enhanced security:

1. **Client API Gateway** (Port 3000) - Public-facing for passengers and drivers
2. **Admin API Gateway** (Port 3010) - Secure admin-only access with JWT authentication

## Architecture

```
┌─────────────────┐        ┌──────────────────┐
│  Client Apps    │───────▶│  Client Gateway  │
│  (Frontend)     │        │  Port 3000       │
└─────────────────┘        └──────────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │   Microservices │
                           │  - Auth         │
                           │  - Booking      │
                           │  - Driver       │
                           │  - Payment      │
                           └─────────────────┘
                                    ▲
                                    │
┌─────────────────┐        ┌──────────────────┐
│  Admin Panel    │───────▶│  Admin Gateway   │
│  (Port 3200)    │        │  Port 3010       │
└─────────────────┘        └──────────────────┘
```

## Security Features

### Client Gateway (Port 3000)
- ✅ Rate limiting: 100 requests per 15 minutes
- ✅ CORS enabled for frontend (localhost:3100)
- ✅ Public booking endpoints
- ✅ Authentication endpoints
- ❌ **NO admin routes** - completely isolated

### Admin Gateway (Port 3010)
- ✅ Stricter rate limiting: 50 requests per 15 minutes
- ✅ CORS only for admin panel (localhost:3200)
- ✅ **JWT authentication required on ALL routes**
- ✅ **Role-based access control** - only admin role allowed
- ✅ Full access to all microservices
- ✅ User management endpoints

## Admin Authentication

All admin requests must include a JWT token with `role: 'admin'`:

```bash
Authorization: Bearer <JWT_TOKEN>
```

### Response Codes
- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Valid token but not admin role
- **200 OK** - Success

## Available Admin Routes

### Admin Service
```
GET/POST/PUT/DELETE /api/admin/*
```

### Booking Management
```
GET    /api/bookings           # List all bookings
GET    /api/bookings/:id       # Get booking details
GET    /api/bookings/:id/receipt # Download receipt
PATCH  /api/bookings/:id/status  # Update booking status
```

### Driver Management
```
GET/POST/PUT/DELETE /api/drivers/*
```

### Payment Management
```
GET/POST/PUT/DELETE /api/payments/*
```

### User Management
```
GET/POST/PUT/DELETE /api/users/*
```

### Location Management
```
GET/POST/PUT/DELETE /api/locations/*
```

## Deployment

### Docker Compose

```yaml
admin-gateway:
  build: ./services/admin-gateway
  ports:
    - "3010:3010"
  environment:
    - NODE_ENV=production
    - PORT=3010
    - JWT_SECRET=${JWT_SECRET}
    - ADMIN_CORS_ORIGINS=https://admin.ebulanwings.com
    - BOOKING_SERVICE_URL=http://booking-service:3002
    # ... other service URLs
  networks:
    - eaa-network
```

### Kubernetes Ingress

Create separate ingress for admin:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: admin-gateway-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "50"
    nginx.ingress.kubernetes.io/whitelist-source-range: "10.0.0.0/8" # Internal only
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - admin-api.ebulanwings.com
      secretName: admin-tls
  rules:
    - host: admin-api.ebulanwings.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: admin-gateway
                port:
                  number: 3010
```

## Production Recommendations

### 1. Network Isolation
- Deploy admin gateway in **private subnet**
- Use VPN or bastion host for access
- Whitelist admin panel IPs only

### 2. Additional Security
```bash
# Add IP whitelisting in nginx
nginx.ingress.kubernetes.io/whitelist-source-range: "YOUR_OFFICE_IP/32"

# Enable mTLS
nginx.ingress.kubernetes.io/auth-tls-secret: "default/admin-client-ca"

# Add basic auth as second layer
nginx.ingress.kubernetes.io/auth-type: basic
nginx.ingress.kubernetes.io/auth-secret: admin-basic-auth
```

### 3. Monitoring
- Set up alerts for failed authentication attempts
- Monitor rate limit breaches
- Log all admin actions with user context
- Use Prometheus metrics for request rates

### 4. Environment Variables
```bash
# Production secrets
JWT_SECRET=<strong-256-bit-secret>
ADMIN_CORS_ORIGINS=https://admin.ebulanwings.com
NODE_ENV=production

# Service mesh URLs
ADMIN_SERVICE_URL=http://admin-service.eaa.svc.cluster.local:3007
BOOKING_SERVICE_URL=http://booking-service.eaa.svc.cluster.local:3002
```

## Testing

### Health Check
```bash
curl http://localhost:3010/health
```

### Admin Authentication
```bash
# Get admin token first
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ebulan.com","password":"admin123"}' \
  | jq -r '.token')

# Access admin endpoint
curl http://localhost:3010/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

## Benefits

1. **Security Separation** - Admin functions completely isolated
2. **Network Segmentation** - Different ingress rules per gateway
3. **Audit Trail** - All admin actions logged separately
4. **Rate Limiting** - Stricter limits on admin endpoints
5. **Compliance** - Easier to meet regulatory requirements
6. **DDoS Protection** - Public gateway can be attacked without affecting admin

## Validation Fix

The booking validation has been updated to accept `passengerName` field:

```typescript
// services/booking-service/src/utils/validation.ts
export const guestBookingSchema = Joi.object({
  serviceType: Joi.string()
    .valid('taxi', 'cargo', 'delivery', 'airport')
    .required(),
  pickupLocation: Joi.string().required().min(3).max(500),
  dropoffLocation: Joi.string().required().min(3).max(500),
  passengerName: Joi.string().min(2).max(100).allow('', null), // ✅ Added
  phone: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/),
  scheduledDate: Joi.date().required(),
  scheduledTime: Joi.string().required().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  notes: Joi.string().max(1000).allow('', null),
  isGuest: Joi.boolean().default(true),
  userId: Joi.number().optional().allow(null)
});
```

## Quick Start

```bash
# Start all services including admin gateway
docker compose up -d

# Verify services
curl http://localhost:3000/health  # Client gateway
curl http://localhost:3010/health  # Admin gateway

# Test booking (should work now)
curl -X POST http://localhost:3000/api/bookings/guest \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "taxi",
    "pickupLocation": "Airport",
    "dropoffLocation": "Hotel Downtown",
    "passengerName": "John Doe",
    "phone": "1234567890",
    "scheduledDate": "2026-02-18",
    "scheduledTime": "14:30"
  }'
```

## Support

For issues or questions:
1. Check logs: `docker compose logs admin-gateway`
2. Verify JWT token is valid and has admin role
3. Ensure CORS origins are correctly configured
4. Check network connectivity between gateways and services
