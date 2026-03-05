# ITT-Orchestrator Helm Chart

Production-grade Kubernetes deployment for the Intent-to-Task Orchestrator, a self-driving unified logical control plane for Tier-1 financial institutions.

## Prerequisites

- Kubernetes 1.24+ with RBAC enabled
- Helm 3.0+
- Persistent Volume Provisioner (e.g., AWS EBS, GCP Persistent Disk, or local storage class)
- NGINX Ingress Controller (or alternative ingress implementation)
- cert-manager (optional, for automated TLS)

## Quick Start

### 1. Development Deployment

```bash
# Create namespace
kubectl create namespace itt-system

# Install with default values
helm install itt-dev deploy/helm/itt-orchestrator \
  -n itt-system \
  --create-namespace
```

### 2. Production Deployment

```bash
# Create namespace
kubectl create namespace itt-prod

# Update production secrets
export MONGODB_PASSWORD="your-secure-password"
export NEO4J_PASSWORD="your-secure-password"

# Install with production overrides
helm install itt deploy/helm/itt-orchestrator \
  -f deploy/helm/itt-orchestrator/values.yaml \
  -f deploy/helm/itt-orchestrator/values-prod.yaml \
  --set database.mongodb.password="$MONGODB_PASSWORD" \
  --set database.neo4j.password="$NEO4J_PASSWORD" \
  -n itt-prod \
  --create-namespace
```

## File Structure

```
deploy/helm/itt-orchestrator/
├── Chart.yaml                          # Chart metadata (v1.0.0)
├── values.yaml                         # Default configuration (dev/staging)
├── values-prod.yaml                    # Production overrides (3 replicas, 4Gi RAM)
└── templates/
    ├── _helpers.tpl                    # Helm template helpers
    ├── NOTES.txt                       # Post-installation notes
    │
    ├── Deployments & StatefulSets
    ├── deployment-api.yaml             # Rust Control Plane (multi-replica, graceful shutdown)
    ├── deployment-frontend.yaml        # React Frontend (Node + NGINX)
    ├── deployment-otel.yaml            # OpenTelemetry Collector
    ├── deployment-jaeger.yaml          # Jaeger all-in-one or distributed
    ├── statefulset-mongodb.yaml        # MongoDB with persistent volumes
    ├── statefulset-neo4j.yaml          # Neo4j with persistent volumes
    │
    ├── Services (ClusterIP/Headless)
    ├── service-api.yaml                # API service (port 3001, 4317 OTEL)
    ├── service-frontend.yaml           # Frontend service (port 3000)
    ├── service-otel.yaml               # OTEL Collector service (4317, 4318)
    ├── service-jaeger.yaml             # Jaeger service (16686 UI, 14250 gRPC)
    ├── service-mongodb.yaml            # MongoDB headless service
    ├── service-neo4j.yaml              # Neo4j headless service
    │
    ├── Networking & Routing
    ├── ingress.yaml                    # External routing (TLS, path-based)
    ├── networkpolicy.yaml              # Zone-based egress/ingress rules
    │
    ├── Configuration & Secrets
    ├── configmap-otel.yaml             # OTEL Collector configuration
    ├── secret.yaml                     # Database credentials (base64-encoded)
    │
    ├── RBAC & Availability
    ├── serviceaccount.yaml             # Kubernetes service account
    ├── hpa.yaml                        # Horizontal Pod Autoscaler (2-10 replicas)
    └── pdb.yaml                        # Pod Disruption Budgets (HA)
```

## Configuration

### 1. Database Passwords (CRITICAL for Production)

Update `values-prod.yaml` with secure passwords:

```bash
# Generate secure passwords
openssl rand -base64 32
```

Then update in values-prod.yaml:
```yaml
database:
  mongodb:
    password: "YOUR_SECURE_MONGODB_PASSWORD"
  neo4j:
    password: "YOUR_SECURE_NEO4J_PASSWORD"
```

### 2. Ingress Configuration

For external access, configure ingress hosts:

```yaml
ingress:
  enabled: true
  hosts:
    - host: api.itt-orchestrator.example.com
      paths:
        - path: /
    - host: dashboard.itt-orchestrator.example.com
      paths:
        - path: /
  tls:
    - secretName: itt-tls
      hosts:
        - api.itt-orchestrator.example.com
        - dashboard.itt-orchestrator.example.com
```

### 3. Resource Limits

Adjust for your cluster capacity:

```yaml
resources:
  api:
    requests:
      cpu: 100m       # minimum to reserve
      memory: 256Mi
    limits:
      cpu: 500m       # maximum allowed
      memory: 512Mi
```

### 4. Persistent Storage

Configure storage class for your cloud provider:

```yaml
persistence:
  mongodb:
    storageClassName: "fast-ssd"  # AWS: gp3, GCP: pd-ssd, Azure: managed-premium
    size: 10Gi
  neo4j:
    storageClassName: "fast-ssd"
    size: 20Gi
```

## Deployment Verification

### 1. Check Pod Status

```bash
# Watch all pods
kubectl get pods -n itt-system -w

# Check specific deployment
kubectl rollout status deployment/itt-orchestrator-api -n itt-system
kubectl rollout status statefulset/itt-orchestrator-mongodb -n itt-system
```

### 2. Verify Database Connectivity

```bash
# MongoDB
kubectl exec -it itt-orchestrator-mongodb-0 -n itt-system -- mongosh --eval "db.adminCommand('ping')"

# Neo4j
kubectl port-forward -n itt-system svc/itt-orchestrator-neo4j 7474:7474
# Visit: http://localhost:7474 (default user: neo4j)
```

### 3. Check API Health

```bash
# Port forward API
kubectl port-forward -n itt-system svc/itt-orchestrator-api 3001:3001

# Test health endpoint
curl http://localhost:3001/health
```

### 4. View Jaeger Traces

```bash
# Port forward Jaeger UI
kubectl port-forward -n itt-system svc/itt-orchestrator-jaeger 16686:16686

# Visit: http://localhost:16686
# Service: itt-orchestrator-control-plane
```

### 5. Check Logs

```bash
# API logs
kubectl logs -n itt-system -l "app.kubernetes.io/name=itt-orchestrator,component=api" -f

# Frontend logs
kubectl logs -n itt-system -l "app.kubernetes.io/name=itt-orchestrator,component=frontend" -f

# OTEL Collector logs
kubectl logs -n itt-system -l "app.kubernetes.io/name=itt-orchestrator,component=otel" -f
```

## Security Considerations

### 1. Network Policies

NetworkPolicy restricts traffic to:
- **Ingress**: Only from NGINX Ingress Controller
- **Egress**: Only to MongoDB, Neo4j, OTEL, Jaeger, and DNS

Update `networkpolicy.yaml` for your specific requirements.

### 2. Pod Security

All containers run as:
- Non-root user (UID 1000)
- Read-only root filesystem
- Dropped ALL capabilities

### 3. RBAC

ServiceAccount created with minimal permissions. Extend as needed:

```bash
kubectl get serviceaccount -n itt-system
kubectl get rolebinding -n itt-system
```

### 4. Secrets Management

For production, use external-secrets-operator:

```bash
# Install external-secrets-operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system

# Create ExternalSecret referencing AWS Secrets Manager, HashiCorp Vault, etc.
```

## Scaling & High Availability

### 1. Horizontal Pod Autoscaling

HPA scales API pods 2-10 replicas based on:
- CPU utilization > 70%
- Memory utilization > 80%

Adjust thresholds in values-prod.yaml:

```yaml
autoscaling:
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 75
  targetMemoryUtilizationPercentage: 80
```

### 2. Pod Disruption Budgets

Ensures minimum availability during cluster maintenance:

```yaml
podDisruptionBudget:
  minAvailable: 1  # At least 1 pod must stay running
```

### 3. Multi-Zone Deployment

Configure pod anti-affinity in values-prod.yaml:

```yaml
affinity:
  api:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - topologyKey: kubernetes.io/hostname
```

## Monitoring & Observability

### 1. Prometheus Metrics

API pods expose metrics on port 9090:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9090"
```

### 2. Distributed Tracing

OpenTelemetry integration with Jaeger:

```yaml
otel:
  endpoint: "http://itt-orchestrator-otel:4317"
  serviceName: "itt-orchestrator-control-plane"
  samplingRate: 1.0  # 100% in dev, 10% in prod
```

### 3. Structured Logging

All Rust components emit JSON logs:

```bash
kubectl logs -n itt-system <pod-name> | jq '.level, .message, .service'
```

## Upgrading

### 1. Update Chart Values

```bash
# Review changes
helm diff upgrade itt deploy/helm/itt-orchestrator --values values-prod.yaml -n itt-system

# Apply upgrade
helm upgrade itt deploy/helm/itt-orchestrator --values values-prod.yaml -n itt-system
```

### 2. Rolling Restart (if needed)

```bash
# Restart API pods with rolling restart
kubectl rollout restart deployment/itt-orchestrator-api -n itt-system

# Monitor
kubectl rollout status deployment/itt-orchestrator-api -n itt-system
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n itt-system

# Check resource availability
kubectl top nodes
kubectl top pods -n itt-system
```

### Database Connection Issues

```bash
# Test MongoDB connectivity
kubectl run -it --rm debug --image=mongo:7 --restart=Never -- mongosh mongodb://itt-user:changeme@itt-orchestrator-mongodb:27017

# Test Neo4j connectivity
kubectl run -it --rm debug --image=neo4j:5 --restart=Never -- cypher-shell -a bolt://itt-orchestrator-neo4j:7687
```

### OTEL Collector Not Receiving Traces

```bash
# Check OTEL Collector logs
kubectl logs -n itt-system -l component=otel

# Verify DNS resolution
kubectl exec -it <api-pod> -n itt-system -- nslookup itt-orchestrator-otel
```

## Performance Tuning

### 1. Database Optimization

For MongoDB (values-prod.yaml):
```yaml
database:
  mongodb:
    resources:
      requests:
        memory: 2Gi
      limits:
        memory: 4Gi
```

For Neo4j (values-prod.yaml):
```yaml
database:
  neo4j:
    resources:
      requests:
        memory: 4Gi
      limits:
        memory: 8Gi
```

### 2. Request/Response Timeout

API deployment (deployment-api.yaml):
```yaml
env:
- name: REQUEST_TIMEOUT
  value: "30s"
```

### 3. Connection Pool Settings

Adjust in OTEL config (configmap-otel.yaml):
```yaml
processors:
  batch:
    send_batch_size: 2048
    timeout: 10s
```

## Uninstalling

```bash
# Delete release
helm uninstall itt -n itt-system

# Delete namespace
kubectl delete namespace itt-system

# Clean up persistent volumes (be careful!)
kubectl delete pvc --all -n itt-system
```

## Support & Contributing

For issues, feature requests, or contributions:
- GitHub Issues: https://github.com/anthropics/itt-orchestrator/issues
- GitHub Discussions: https://github.com/anthropics/itt-orchestrator/discussions
- CONTRIBUTING.md: See project root for contribution guidelines

## License

Apache License 2.0 - See LICENSE file in repository
