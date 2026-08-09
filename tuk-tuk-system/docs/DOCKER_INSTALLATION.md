# EAA Tuk-Tuk System - Docker Installation Guide

## Current Status
❌ Docker is not installed on your system  
❌ Docker Compose is not available

## Installation Options

### Option 1: Install Docker Desktop (Recommended for Development)

Docker Desktop includes Docker Engine, Docker Compose, and a GUI.

#### For Ubuntu/Debian:
```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Docker Compose
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and log back in for group changes to take effect
# Or run: newgrp docker
```

#### Verify Installation:
```bash
docker --version
docker compose version
```

### Option 2: Install Docker Desktop GUI

Download from: https://www.docker.com/products/docker-desktop/

### Option 3: Manual Docker Engine Installation

If you prefer server installation without GUI:

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose plugin
sudo apt-get install docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## Post-Installation Steps

### 1. Verify Docker is Running
```bash
docker ps
```

### 2. Test Docker Installation
```bash
docker run hello-world
```

### 3. Start EAA Services
```bash
cd /home/nduasheym/EAA/tuk-tuk-system
./scripts/start.sh
```

## Alternative: Run Without Docker

If you prefer not to use Docker for development:

### 1. Install PostgreSQL
```bash
sudo apt-get install postgresql postgresql-contrib
```

### 2. Install MongoDB
```bash
# Follow: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/
```

### 3. Install Redis
```bash
sudo apt-get install redis-server
```

### 4. Install Node.js Dependencies
```bash
cd /home/nduasheym/EAA/tuk-tuk-system

# Install frontend dependencies
cd frontend
npm install

# Install API Gateway dependencies
cd ../services/api-gateway
npm install
```

### 5. Use Development Script
```bash
cd /home/nduasheym/EAA/tuk-tuk-system
./scripts/dev-no-docker.sh
```

## Quick Install (Ubuntu/Debian)

Run this one-liner to install everything:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && sudo usermod -aG docker $USER && sudo systemctl start docker && echo "Docker installed! Please log out and log back in, then run: docker --version"
```

## Troubleshooting

### "Permission denied" when running docker
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Docker daemon not starting
```bash
sudo systemctl start docker
sudo systemctl status docker
```

### Check Docker logs
```bash
sudo journalctl -u docker.service
```

## Next Steps

After installing Docker:
1. Log out and log back in (for group permissions)
2. Run: `docker --version` to verify
3. Run: `docker compose version` to verify Compose
4. Navigate to project: `cd /home/nduasheym/EAA/tuk-tuk-system`
5. Start services: `./scripts/start.sh`
