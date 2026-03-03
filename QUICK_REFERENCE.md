# Quick Reference Guide

## 🚀 Getting Started in 60 Seconds

### 1. Start Services (Automated)
```bash
bash quickstart.sh          # Linux/macOS
# OR
quickstart.bat              # Windows
```

Services will be available at:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **Health:** http://localhost:3001/health

### 2. Login & Get Token
```bash
curl -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"test"}'

# Response:
{
  "token": "eyJhbGc...",
  "expires_in": 86400,
  "token_type": "Bearer"
}
```

### 3. Use the Token
Save the token and use it in subsequent requests:
```bash
TOKEN="eyJhbGc..."

curl http://localhost:3001/api/v1/registry \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📡 API Endpoints

### Authentication
```
POST /auth/login
  ├─ Request: { username, password }
  ├─ Response: { token, expires_in, token_type }
  └─ Auth required: NO
```

### Health & Status
```
GET /health
  ├─ Response: { status, version, timestamp, uptime_secs }
  └─ Auth required: NO

GET /readiness
  ├─ Response: { status, ... }
  └─ Auth required: NO (for K8s probes)
```

### API Registry
```
GET /api/v1/registry
  ├─ Returns: Array of discovered APIs
  └─ Auth required: YES

POST /api/v1/integrations
  ├─ Request: { name, type, endpoint, credentials }
  ├─ Returns: { id, status, message }
  └─ Auth required: YES

DELETE /api/v1/registry/{id}
  ├─ Returns: 204 No Content
  └─ Auth required: YES
```

### Gateway Zones
```
GET /api/v1/zones
  ├─ Returns: Array of zones
  └─ Auth required: YES

POST /api/v1/zones
  ├─ Request: { name, description, ips, filters }
  ├─ Returns: { id, status }
  └─ Auth required: YES
```

### Master Data Management
```
GET /api/v1/mdm/rules
  ├─ Returns: Array of MDM rules
  └─ Auth required: YES

POST /api/v1/mdm/rules
  ├─ Request: { name, rule_type, conditions, actions }
  ├─ Returns: Created rule
  └─ Auth required: YES

DELETE /api/v1/mdm/rules/{id}
  ├─ Returns: 204 No Content
  └─ Auth required: YES
```

### Orchestration
```
POST /api/v1/generate-dag
  ├─ Request: { prompt }
  ├─ Returns: { dag_id, nodes, edges }
  └─ Auth required: YES
```

---

## ⚙️ Configuration

### Critical Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# Databases
MONGODB_URI=mongodb://user:pass@localhost:27017
MONGODB_DATABASE=itt_orchestrator
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4j

# Security (CHANGE THESE!)
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=24h
CORS_ORIGINS=http://localhost:3000

# Feature Flags
TEST_MODE=true  # false in production
ENABLE_COST_ARBITRAGE=true
ENABLE_SEMANTIC_FIREWALL=true

# Performance
RATE_LIMIT_PER_MINUTE=100
CACHE_TTL_SECS=600
DATABASE_POOL_SIZE=20

# Compliance
DPDP_ENABLED=true
GDPR_ENABLED=true
```

**⚠️ IMPORTANT:** Change `JWT_SECRET` and `TEST_MODE` before production!

---

## 🐳 Docker Useful Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Check services status
docker-compose ps

# Stop services
docker-compose down

# View service details
docker inspect itt_api

# Shell into container
docker exec -it itt_api bash

# Restart single service
docker-compose restart backend
```

---

## 🧪 Common API Usage Examples

### Complete Flow Example

```bash
#!/bin/bash

# 1. Login
LOGIN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"test"}')

TOKEN=$(echo $LOGIN | jq -r '.token')
echo "Token: $TOKEN"

# 2. Get Registry
curl -s http://localhost:3001/api/v1/registry \
  -H "Authorization: Bearer $TOKEN" | jq .

# 3. Create Integrations
curl -s -X POST http://localhost:3001/api/v1/integrations \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "HDFC Bank API",
    "type": "api",
    "endpoint": "https://api.hdfc.com",
    "credentials": {"api_key": "xxx"}
  }'

# 4. Create Zone
curl -s -X POST http://localhost:3001/api/v1/zones \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Zone 1 - Fortress",
    "description": "External ingress",
    "ips": ["10.0.0.0/8"],
    "filters": ["tls_required"]
  }'

# 5. Generate DAG
curl -s -X POST http://localhost:3001/api/v1/generate-dag \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt": "transfer money to account 123456"}'
```

---

## 📊 Monitoring & Debugging

### Check Service Health
```bash
# API Health
curl http://localhost:3001/health | jq .

# Docker Status
docker stats --no-stream

# Database Connection
docker exec itt_mongodb mongosh -u admin -p <password> --eval "db.adminCommand('ping')"

# Logs
docker-compose logs --tail=100 backend | jq '.' | grep ERROR
```

### Performance Monitoring
```bash
# Load test with k6
k6 run --vus 10 --duration 30s - << 'EOF'
import http from 'k6/http';
export default function() {
  let res = http.get('http://localhost:3001/health');
  console.log(`Status: ${res.status}`);
}
EOF

# With Apache Bench
ab -n 1000 -c 10 http://localhost:3001/health
```

### Error Investigation
```bash
# Find errors in logs
docker-compose logs backend | grep ERROR

# View rate limit violations
docker-compose logs backend | grep "rate_limit_exceeded"

# Check database connection errors
docker-compose logs backend | grep "database"
```

---

## 🔧 Development Workflows

### Adding a New Endpoint

1. **Update OpenAPI spec** (`openapi.yml`)
2. **Add route** in `backend/crates/itt_api/src/routes.rs`
3. **Create model** in `backend/crates/itt_api/src/models.rs`
4. **Handle auth** if needed using `AuthUser` extractor
5. **Test** the endpoint

### Adding Configuration Option

1. **Update** `.env.example`
2. **Add to** `backend/crates/itt_api/src/config.rs`
3. **Use in** `main.rs` initialization

### Debugging API Issues

```bash
# Enable debug logging
RUST_LOG=debug docker-compose up

# View request/response
curl -v http://localhost:3001/api/v1/registry \
  -H "Authorization: Bearer $TOKEN"

# Check rate limiting
for i in {1..150}; do 
  curl -s http://localhost:3001/api/v1/registry \
    -H "Authorization: Bearer $TOKEN" | head -1
done
```

---

## 📈 Rate Limiting Examples

### How Rate Limiting Works

**Default:** 100 requests/minute per IP address

```bash
# Requests 1-100: ✅ Success
for i in {1..100}; do
  curl http://localhost:3001/api/v1/registry \
    -H "Authorization: Bearer $TOKEN"
done

# Request 101: ❌ 429 Too Many Requests
curl http://localhost:3001/api/v1/registry \
  -H "Authorization: Bearer $TOKEN"
# Response headers include: Retry-After: 45

# After 60 seconds: ✅ Allowed again
```

### Change Rate Limit

Edit `.env`:
```bash
RATE_LIMIT_PER_MINUTE=1000
```

Then restart:
```bash
docker-compose restart backend
```

---

## 🚨 Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | None |
| 201 | Created | None |
| 204 | No Content | None |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Add `Authorization` header |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Check endpoint URL |
| 429 | Rate Limited | Wait before retrying |
| 500 | Server Error | Check logs |
| 503 | Service Unavailable | Database down? |

### Error Response Format

```json
{
  "error_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": 400,
  "message": "Invalid request parameter",
  "details": "Field 'name' is required",
  "timestamp": "2026-03-03T10:30:00Z"
}
```

---

## 🔐 Security Quick Checks

```bash
# Verify SSL/TLS (production)
curl -v https://api.example.com/health

# Test authentication bypass (should fail)
curl http://localhost:3001/api/v1/registry
# Response: 401 Unauthorized

# Test malicious payload (should be blocked)
curl -X POST http://localhost:3001/api/v1/zones \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "<script>alert(1)</script>"}'

# Verify rate limiting
for i in {1..150}; do curl -s http://localhost:3001/health > /dev/null; done
# Check response: Should have 429 errors
```

---

## 📞 Troubleshooting

### "Connection refused" on localhost:3001
```bash
# Check if container is running
docker-compose ps

# View logs
docker-compose logs backend

# Restart
docker-compose down
docker-compose up -d
```

### "Unauthorized" (401 Error)
```bash
# Get new token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"test"}' | jq -r '.token')

# Verify token format
echo $TOKEN | cut -d'.' -f1 | base64 -d | jq .
```

### "Too Many Requests" (429 Error)
```bash
# Wait for rate limit window to reset (60 seconds)
sleep 60

# Or increase limit in .env
RATE_LIMIT_PER_MINUTE=500
docker-compose restart backend
```

### Database connection errors
```bash
# Check MongoDB
docker-compose logs mongodb | tail -20

# Check Neo4j
docker-compose logs neo4j | tail -20

# Verify credentials in .env match docker-compose.yml
```

---

## 📚 Additional Resources

- **Full Documentation:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Production Checklist:** [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- **API Specification:** [openapi.yml](./openapi.yml)
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Implementation Status:** [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)

---

**Last Updated:** March 3, 2026  
**Quick Reference Version:** 1.0
