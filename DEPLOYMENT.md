# ITT-Orchestrator Deployment Guide

## Overview

This guide covers production deployment of ITT-Orchestrator on both containerized and VM environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Deployment](#docker-deployment)
3. [VM Deployment (Systemd)](#vm-deployment-systemd)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Docker**: 20.10+ (for container deployment)
- **Rust**: 1.75+ (for building from source)
- **Node.js**: 18+ (for frontend)
- **RAM**: Minimum 4GB, recommended 8GB+
- **Disk**: Minimum 20GB SSD
- **OS**: Linux (Ubuntu 20.04+), MacOS, or Windows with WSL2

### Install Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y \
    docker.io \
    docker-compose \
    git \
    curl
```

**macOS (with Homebrew):**
```bash
brew install docker docker-compose git curl
```

---

## Docker Deployment

### Quick Start (Development)

```bash
# Clone repository
git clone <repo-url>
cd ITT-Orchestrator

# Create .env from template
cp .env.example .env

# Edit .env with your values
nano .env

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps
docker-compose logs -f backend
```

Visit:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Neo4j Browser**: http://localhost:7474
- **MongoDB Express** (optional): http://localhost:8081

### Production Deployment

```bash
# Build custom image
docker build -t my-registry/itt-orchestrator:1.0.0 .

# Push to registry
docker push my-registry/itt-orchestrator:1.0.0

# Deploy with production compose
docker-compose -f docker-compose.prod.yml up -d

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Environment Variables (docker-compose.prod.yml)

Create `.env.production`:

```bash
MONGODB_USERNAME=mongoadmin
MONGODB_PASSWORD=<strong-password>
MONGODB_DATABASE=itt_orchestrator

NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<strong-password>

REDIS_PASSWORD=<strong-password>

JWT_SECRET=<generate-with: openssl rand -base64 32>
JWT_EXPIRY=24h

CORS_ORIGINS=https://app.example.com,https://admin.example.com
ALLOWED_HOSTS=api.example.com

MONGODB_URI=mongodb://mongoadmin:<password>@mongodb:27017
NEO4J_URI=bolt://neo4j:7687

NODE_ENV=production
LOG_LEVEL=info
```

Then deploy:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## VM Deployment (Systemd)

### 1. Install Runtime Dependencies

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Node.js
curl -sL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Neo4j
sudo apt-get install -y openjdk-17-jdk-headless
wget -O neo4j.tar.gz https://dist.neo4j.org/neo4j-community-5.15.0-unix.tar.gz
tar -xzf neo4j.tar.gz
sudo mv neo4j-community-5.15.0 /opt/neo4j
```

### 2. Create Application User

```bash
sudo useradd -m -s /bin/bash itt_app
sudo usermod -aG docker itt_app  # If using Docker
```

### 3. Clone and Build

```bash
sudo -u itt_app git clone <repo-url> /opt/itt-orchestrator
cd /opt/itt-orchestrator
sudo chown -R itt_app:itt_app .

# Build backend
cd backend
cargo build --release

# Build frontend
cd ..
npm install
npm run build
```

### 4. Systemd Service Files

Create `/etc/systemd/system/itt-backend.service`:

```ini
[Unit]
Description=ITT-Orchestrator Backend API
After=network.target mongodb.service neo4j.service
Wants=network-online.target

[Service]
Type=simple
User=itt_app
WorkingDirectory=/opt/itt-orchestrator/backend
EnvironmentFile=/opt/itt-orchestrator/.env
ExecStart=/opt/itt-orchestrator/backend/target/release/itt_api
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=itt-backend

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/itt-orchestrator/logs

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/itt-frontend.service`:

```ini
[Unit]
Description=ITT-Orchestrator Frontend
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=itt_app
WorkingDirectory=/opt/itt-orchestrator
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/node /opt/itt-orchestrator/index.tsx
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 5. Enable and Start Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable itt-backend itt-frontend
sudo systemctl start itt-backend itt-frontend

# Verify
sudo systemctl status itt-backend itt-frontend
sudo journalctl -u itt-backend -f
```

---

## Environment Configuration

### Critical Variables

| Variable | Type | Required | Example |
|----------|------|----------|---------|
| `PORT` | Number | No | 3001 |
| `NODE_ENV` | String | Yes | production |
| `MONGODB_URI` | String | Yes | mongodb://user:pass@localhost:27017 |
| `MONGODB_DATABASE` | String | Yes | itt_orchestrator |
| `NEO4J_URI` | String | Yes | bolt://localhost:7687 |
| `NEO4J_USERNAME` | String | Yes | neo4j |
| `NEO4J_PASSWORD` | String | Yes | secure_password |
| `JWT_SECRET` | String | Yes | Generate with: `openssl rand -base64 32` |
| `CORS_ORIGINS` | String | Yes | https://app.example.com |

### Security Best Practices

```bash
# Generate strong secrets
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 24   # Passwords

# Use AWS Secrets Manager, HashiCorp Vault, or similar
# Never commit .env files
# Rotate secrets quarterly
# Use TLS for all communications
```

---

## Database Setup

### MongoDB

```bash
# Start MongoDB
docker run -d --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v mongodb_data:/data/db \
  mongo:7.0

# Initialize databases
docker exec mongodb mongosh -u admin -p password \
  /docker-entrypoint-initdb.d/init.js
```

### Neo4j

```bash
# Start Neo4j
docker run -d --name neo4j \
  -e NEO4J_AUTH=neo4j/password \
  -v neo4j_data:/var/lib/neo4j/data \
  neo4j:5.15
```

### Backup Strategy

```bash
# MongoDB backup (daily)
0 2 * * * /usr/bin/mongodump --uri="mongodb://..." --out=/backups/mongodb/$(date +\%Y\%m\%d)

# Retain 30 days
0 3 * * * find /backups/mongodb -type d -mtime +30 -exec rm -rf {} \;
```

---

## Monitoring & Logging

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Database connectivity
mongosh --eval "db.adminCommand('ping')"
curl -u neo4j:password http://localhost:7474/db/neo4j/tx
```

### Logging

Logs are structured JSON in production:

```bash
# View backend logs
docker logs itt_api | jq .

# Filter by level
docker logs itt_api | jq 'select(.level=="ERROR")'
```

### Observability Stack (Optional)

```bash
# Prometheus + Grafana
docker run -d -p 9090:9090 prom/prometheus
docker run -d -p 3000:3000 grafana/grafana

# Jaeger (Distributed Tracing)
docker run -d -p 6831:6831/udp -p 16686:16686 jaegertracing/all-in-one
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker logs itt_api

# Common issues:
# 1. Database not accessible
docker exec itt_api curl mongodb:27017
docker exec itt_api curl neo4j:7687

# 2. Port already in use
lsof -i :3001

# 3. Configuration missing
docker exec itt_api env | grep MONGODB
```

### High Memory Usage

```bash
# Check current usage
docker stats
free -h

# Adjust heap size (in docker-compose.prod.yml)
environment:
  NEO4J_server_memory_heap_max__size: 4G
```

### Database Connection Pooling

Monitor connections:
```bash
# MongoDB
mongosh --eval "db.serverStatus().connections"

# Neo4j
curl -u neo4j:password http://localhost:7474/manage/server/jmx
```

---

## Production Checklist

- [ ] All `NODE_ENV=production`
- [ ] `JWT_SECRET` changed from default
- [ ] Database credentials updated
- [ ] TLS/HTTPS enabled
- [ ] `CORS_ORIGINS` restricted to known domains
- [ ] Audit logging enabled (`AUDIT_LOG_ENABLED=true`)
- [ ] DPDP/GDPR compliance flags configured
- [ ] Backups configured and tested
- [ ] Monitoring & alerting setup
- [ ] Log aggregation enabled
- [ ] Secrets stored in vault/secrets manager
- [ ] Rate limiting configured
- [ ] Health checks passing
