# EAA Tuk-Tuk System - Management Scripts Reference

## 🎯 New Scripts Available

### 1. **Comprehensive Health Check**
```bash
./scripts/healthcheck.sh
```
**What it checks:**
- System requirements (Node.js, npm, Docker, Git)
- Docker daemon status
- Infrastructure services (PostgreSQL, MongoDB, Redis, RabbitMQ)
- Project structure and files
- Installed dependencies
- Port availability
- Network connectivity

### 2. **Start Frontend with Browser**
```bash
./scripts/start-frontend.sh
```
**What it does:**
- Checks and installs dependencies if needed
- Starts React development server on port 3100
- Automatically opens browser after 5 seconds
- Shows build output in terminal

### 3. **Open in Terminal Browser**
```bash
./scripts/open-browser.sh
```
**What it does:**
- Opens frontend in text-based browser (lynx/w3m/links)
- Checks if frontend is running first
- Shows installation instructions if no terminal browser found

## 📋 All Available Scripts

### Infrastructure Management
| Script | Purpose |
|--------|---------|
| `./scripts/start-infra.sh` | Start databases only (PostgreSQL, MongoDB, Redis, RabbitMQ) |
| `./scripts/stop-infra.sh` | Stop infrastructure services |
| `./scripts/check.sh` | Check container status and resource usage |

### Application Management
| Script | Purpose |
|--------|---------|
| `./scripts/start-frontend.sh` | Start React frontend with auto-browser open |
| `./scripts/dev-no-docker.sh` | Run frontend & API Gateway locally (no Docker) |
| `./scripts/open-browser.sh` | Open frontend in terminal browser |

### Full Stack Management
| Script | Purpose |
|--------|---------|
| `./scripts/start.sh` | Start everything (infra + apps) |
| `./scripts/start.sh infra` | Start infrastructure only |
| `./scripts/start.sh apps` | Start application services only |
| `./scripts/stop.sh` | Stop all services |
| `./scripts/stop.sh --volumes` | Stop and remove all data |

### Monitoring & Debugging
| Script | Purpose |
|--------|---------|
| `./scripts/healthcheck.sh` | Comprehensive system check |
| `./scripts/logs.sh [service]` | View logs for specific service |
| `./scripts/logs.sh all` | View all service logs |
| `./scripts/restart.sh [service]` | Restart specific service |

### Maintenance
| Script | Purpose |
|--------|---------|
| `./scripts/cleanup.sh` | Deep clean (removes all containers, volumes, images) |

## 🚀 Quick Start Workflow

### First Time Setup
```bash
# 1. Check everything
./scripts/healthcheck.sh

# 2. Start infrastructure
./scripts/start-infra.sh

# 3. Start frontend (will install deps automatically)
./scripts/start-frontend.sh
```

### Daily Development
```bash
# Infrastructure already running? Just start frontend
./scripts/start-frontend.sh

# Or run everything locally (no Docker for apps)
./scripts/dev-no-docker.sh
```

### Troubleshooting
```bash
# Check system health
./scripts/healthcheck.sh

# View service logs
./scripts/logs.sh postgres
./scripts/logs.sh frontend

# Restart a service
./scripts/restart.sh postgres

# Complete reset (WARNING: deletes all data!)
./scripts/cleanup.sh
```

## 🌐 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3100 | - |
| API Gateway | http://localhost:3000 | - |
| PostgreSQL | localhost:5432 | user: eaa_user, pass: eaa_password, db: eaa_db |
| MongoDB | mongodb://localhost:27017 | db: eaa_db |
| Redis | redis://localhost:6379 | - |
| RabbitMQ AMQP | amqp://localhost:5672 | user: eaa_user, pass: eaa_password |
| RabbitMQ UI | http://localhost:15672 | user: eaa_user, pass: eaa_password |

## 💡 Common Tasks

### Check if everything is running
```bash
./scripts/healthcheck.sh
# or
sudo docker ps
```

### Start just the databases
```bash
./scripts/start-infra.sh
```

### Start frontend for development
```bash
./scripts/start-frontend.sh
```

### View real-time logs
```bash
./scripts/logs.sh all
# or specific service
./scripts/logs.sh postgres
```

### Restart a misbehaving service
```bash
./scripts/restart.sh postgres
```

### Open frontend in terminal (text mode)
```bash
# Install terminal browser first
sudo apt install lynx

# Then open
./scripts/open-browser.sh
```

### Clean everything and start fresh
```bash
./scripts/cleanup.sh
./scripts/start-infra.sh
./scripts/start-frontend.sh
```

## 🐛 Common Issues

### "Docker is not running"
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### "Permission denied" when using Docker
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### "Port already in use"
```bash
# Find what's using the port
sudo lsof -i :3100

# Kill the process
kill -9 <PID>
```

### "Module not found" in npm
```bash
cd /home/nduasheym/EAA/tuk-tuk-system/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Frontend won't start
```bash
# Check health
./scripts/healthcheck.sh

# Check logs
./scripts/logs.sh frontend

# Full reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm start
```

## 📊 Script Output Examples

### healthcheck.sh output
```
🔍 EAA Tuk-Tuk System - Health Check
=====================================

1. System Requirements
  Node.js: ✓ Installed (v20.19.4)
  npm: ✓ Installed (9.2.0)
  Docker: ✓ Installed (28.2.2)
  Git: ✓ Installed

2. Docker Service
  Docker Daemon: ✓ Running

3. Infrastructure Services
  PostgreSQL: ✓ Running (localhost:5432)
  MongoDB: ✓ Running (localhost:27017)
  Redis: ✓ Running (localhost:6379)
  RabbitMQ: ✓ Running (localhost:5672/15672)

✅ All checks passed!
```

### start-infra.sh output
```
📦 Starting EAA Infrastructure Services...
==========================================

Starting services...
[+] Running 4/4
 ✔ Container eaa-postgres   Started
 ✔ Container eaa-mongodb    Started
 ✔ Container eaa-redis      Started
 ✔ Container eaa-rabbitmq   Started

✅ Infrastructure services are running!
```

## 🎓 Tips

1. **Always run healthcheck first** when something doesn't work
2. **Infrastructure should be running** before starting frontend/backend
3. **Use `--legacy-peer-deps`** for npm install to avoid dependency conflicts
4. **Check logs** when services fail: `./scripts/logs.sh <service-name>`
5. **Terminal browsers** (lynx/w3m) are useful for quick frontend checks without GUI

## 📚 Related Documentation

- [Quick Start Guide](../QUICK_START.md)
- [Complete Setup](../docs/SETUP_COMPLETE.md)
- [Docker Installation](../docs/DOCKER_INSTALLATION.md)
- [Main README](../README.md)
