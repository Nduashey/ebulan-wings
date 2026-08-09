# Service Management Commands

## Quick Start
```bash
# Start all services (infrastructure + applications)
./scripts/start-services.sh

# Check status
./scripts/status-services.sh

# View logs
./scripts/logs.sh all                # All services
./scripts/logs.sh auth-service       # Specific service
./scripts/logs.sh frontend           # Frontend logs

# Stop all services
./scripts/stop-services.sh
```

## Service URLs

### Application Services
- **Frontend**: http://localhost:3100
- **API Gateway**: http://localhost:3000  
- **Auth Service**: http://localhost:3001

### Infrastructure Services
- **PostgreSQL**: localhost:5432
  - Database: `eaa_db`
  - User: `eaa_user`
  - Password: `eaa_password`
  
- **MongoDB**: localhost:27017
  - Database: `eaa_db`
  - No authentication (development)
  
- **Redis**: localhost:6379
  - No authentication (development)
  
- **RabbitMQ**:
  - AMQP: localhost:5672
  - Management UI: http://localhost:15672
  - User: `admin`
  - Password: `admin123`

## Service Management

### Start Services
```bash
./scripts/start-services.sh
```
This will:
1. Start infrastructure services (PostgreSQL, MongoDB, Redis, RabbitMQ)
2. Start Auth Service (port 3001)
3. Start API Gateway (port 3000)
4. Start Frontend (port 3100)

All services run in the background. PIDs are stored in `.pids/` directory.

### Stop Services
```bash
./scripts/stop-services.sh
```
This will:
1. Stop all application services
2. Stop all infrastructure services (Docker containers)

### Check Status
```bash
./scripts/status-services.sh
```
Shows:
- Running status of each service
- PID and port information
- Port listening status
- Infrastructure container status

### View Logs
```bash
# View all logs
./scripts/logs.sh all

# Tail specific service logs (follows in real-time)
./scripts/logs.sh auth-service
./scripts/logs.sh api-gateway
./scripts/logs.sh frontend

# Press Ctrl+C to stop tailing
```

Log files location: `logs/`
- `logs/auth-service.log`
- `logs/api-gateway.log`
- `logs/frontend.log`

## Testing Auth Service

### Health Check
```bash
curl http://localhost:3001/health | jq .
```

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "Demo1234!",
    "firstName": "Demo",
    "lastName": "User",
    "role": "PASSENGER"
  }' | jq .
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "Demo1234!"
  }' | jq .
```

### Get Profile (Protected)
```bash
# Save token from login response
TOKEN="your-access-token-here"

curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Run Test Suite
```bash
./scripts/test-auth-service.sh
```

## Troubleshooting

### Service Won't Start
1. Check logs: `./scripts/logs.sh [service-name]`
2. Check if port is in use: `netstat -tuln | grep [port]`
3. Check PID file: `cat .pids/[service-name].pid`
4. Manually kill process: `kill $(cat .pids/[service-name].pid)`

### Infrastructure Services Not Running
```bash
# Check Docker
sudo docker ps

# Start manually
cd /home/nduasheym/EAA/tuk-tuk-system
sudo docker-compose up -d

# View Docker logs
sudo docker-compose logs -f
```

### Permission Denied (Docker)
The scripts use `sudo docker` commands. You may be prompted for your password.

To avoid password prompts, add your user to docker group:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Clear All PIDs and Logs
```bash
rm -rf .pids/* logs/*
```

## Development Workflow

### Normal Development
1. Start services: `./scripts/start-services.sh`
2. Make code changes
3. Services auto-reload (nodemon watches for changes)
4. View logs: `./scripts/logs.sh all`
5. Stop services: `./scripts/stop-services.sh`

### Testing Changes
1. Make changes to code
2. Check logs: `./scripts/logs.sh [service-name]`
3. Test endpoints with curl
4. Check status: `./scripts/status-services.sh`

### Restart Single Service
```bash
# Stop specific service
kill $(cat .pids/auth-service.pid)
rm .pids/auth-service.pid

# Start again
./scripts/start-services.sh
```

## Production Checklist

Before deploying to production:

1. ✓ Auth Service with real JWT secrets
2. ✓ Database migrations created
3. ✓ Prisma schema in sync with database
4. ✓ Environment variables configured
5. ✓ Logging configured (Winston)
6. ✓ Error handling middleware
7. ✓ Request validation (Joi)
8. ✓ Rate limiting configured
9. ✓ CORS properly configured
10. ✓ Security headers (Helmet)

Still needed:
- [ ] API Gateway production routing
- [ ] Booking Service
- [ ] Driver Service
- [ ] Payment Service
- [ ] Notification Service
- [ ] Location Service
- [ ] Admin Service
- [ ] Frontend integration with real APIs
- [ ] Docker production images
- [ ] CI/CD pipeline
- [ ] Monitoring and alerting
