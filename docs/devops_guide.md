# DevOps Deployment Guide

Comprehensive guide for deploying and operating Stratos in production environments.

---

## 🎯 Overview

This guide covers:
- Container deployment (Docker, Kubernetes)
- Configuration management
- Monitoring and observability
- Backup and recovery
- Scaling strategies
- Troubleshooting

---

## 🐳 Docker Deployment

### Quick Start (All-in-One)

**Single Container Deployment:**
```bash
# Pull latest image
docker pull ghcr.io/cloudfoundry/stratos:latest

# Run with default settings
docker run -d \
  --name stratos \
  -p 443:443 \
  ghcr.io/cloudfoundry/stratos:latest

# Access at https://localhost:443
# Default credentials: admin/admin
```

### Production Setup (Separate Containers)

**UI Container:**
```bash
docker run -d \
  --name stratos-ui \
  -p 80:80 \
  -p 443:443 \
  -v /path/to/certs:/etc/secrets \
  -e BACKEND_URL=https://backend:5443 \
  ghcr.io/cloudfoundry/stratos-ui:5.0.0
```

**Backend Container:**
```bash
docker run -d \
  --name stratos-backend \
  -p 5443:443 \
  -v /path/to/config:/srv/config \
  -e DATABASE_PROVIDER=postgres \
  -e DATABASE_HOST=postgres \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USER=stratos \
  -e DATABASE_PASSWORD=changeme \
  -e DATABASE_NAME=stratos \
  ghcr.io/cloudfoundry/stratos-backend:5.0.0
```

**Database (PostgreSQL):**
```bash
docker run -d \
  --name stratos-postgres \
  -e POSTGRES_USER=stratos \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=stratos \
  -v /path/to/data:/var/lib/postgresql/data \
  postgres:15
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: stratos-postgres
    environment:
      POSTGRES_USER: stratos
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: stratos
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - stratos-network
    restart: unless-stopped

  backend:
    image: ghcr.io/cloudfoundry/stratos-backend:5.0.0
    container_name: stratos-backend
    environment:
      DATABASE_PROVIDER: postgres
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: stratos
      DATABASE_PASSWORD: ${DB_PASSWORD}
      DATABASE_NAME: stratos
      SESSION_STORE_SECRET: ${SESSION_SECRET}
      ENCRYPTION_KEY_VOLUME: /srv/secrets
    volumes:
      - ./config:/srv/config:ro
      - ./secrets:/srv/secrets:ro
    networks:
      - stratos-network
    depends_on:
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "https://localhost:443/pp/v1/info"]
      interval: 30s
      timeout: 10s
      retries: 3

  ui:
    image: ghcr.io/cloudfoundry/stratos-ui:5.0.0
    container_name: stratos-ui
    ports:
      - "443:443"
      - "80:80"
    environment:
      BACKEND_URL: https://backend:443
    networks:
      - stratos-network
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres-data:

networks:
  stratos-network:
    driver: bridge
```

**Deploy:**
```bash
# Set environment variables
export DB_PASSWORD="$(openssl rand -base64 32)"
export SESSION_SECRET="$(openssl rand -base64 32)"

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes 1.24+
- Helm 3.0+
- kubectl configured
- Persistent volume support

### Helm Installation

**Add Helm Repository:**
```bash
# Add Stratos Helm repo
helm repo add stratos https://cloudfoundry.github.io/stratos
helm repo update

# Search for chart
helm search repo stratos
```

**Install Stratos:**
```bash
# Create namespace
kubectl create namespace stratos

# Install with default values
helm install stratos stratos/console \
  --namespace stratos \
  --version 5.0.0

# Or with custom values
helm install stratos stratos/console \
  --namespace stratos \
  --version 5.0.0 \
  --values values.yaml
```

### Custom Values (values.yaml)

```yaml
# Container images
images:
  ui:
    repository: ghcr.io/cloudfoundry/stratos-ui
    tag: 5.0.0
    pullPolicy: IfNotPresent
  backend:
    repository: ghcr.io/cloudfoundry/stratos-backend
    tag: 5.0.0
    pullPolicy: IfNotPresent

# Ingress configuration
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: stratos.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: stratos-tls
      hosts:
        - stratos.example.com

# Database configuration
database:
  # Use external PostgreSQL
  external: true
  host: postgres.database.svc.cluster.local
  port: 5432
  user: stratos
  password: changeme  # Use secret in production
  database: stratos

  # Or use built-in PostgreSQL
  # external: false
  # persistence:
  #   enabled: true
  #   size: 10Gi
  #   storageClass: standard

# Resource limits
resources:
  ui:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 250m
      memory: 256Mi
  backend:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 500m
      memory: 512Mi

# High availability
replicaCount:
  ui: 2
  backend: 2

# Auto-scaling
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80

# Session configuration
session:
  storeSecret: changeme  # Use secret in production
  expiryTime: 20  # Hours

# Security
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
  capabilities:
    drop:
      - ALL

# Monitoring
serviceMonitor:
  enabled: true
  interval: 30s

# Backup
backup:
  enabled: true
  schedule: "0 2 * * *"  # Daily at 2 AM
  retention: 7  # Days
```

**Deploy with Custom Values:**
```bash
helm install stratos stratos/console \
  --namespace stratos \
  --version 5.0.0 \
  --values values.yaml \
  --wait
```

### Verify Deployment

```bash
# Check pods
kubectl -n stratos get pods

# Check services
kubectl -n stratos get svc

# Check ingress
kubectl -n stratos get ingress

# View logs
kubectl -n stratos logs -l app=stratos -f

# Check status
helm status stratos -n stratos
```

### Upgrade Stratos

```bash
# Update Helm repo
helm repo update

# Check available versions
helm search repo stratos/console --versions

# Upgrade to new version
helm upgrade stratos stratos/console \
  --namespace stratos \
  --version 5.1.0 \
  --values values.yaml \
  --wait

# Rollback if needed
helm rollback stratos -n stratos
```

---

## ⚙️ Configuration Management

### Environment Variables

**Backend Configuration:**
```bash
# Database
DATABASE_PROVIDER=postgres|mysql
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=stratos
DATABASE_PASSWORD=changeme
DATABASE_NAME=stratos
DATABASE_SSL_MODE=disable|require

# Session
SESSION_STORE_SECRET=changeme
SESSION_EXPIRY=20h

# Security
ENCRYPTION_KEY_VOLUME=/srv/secrets
SKIP_SSL_VALIDATION=false

# Logging
LOG_LEVEL=info|debug|warn|error

# Features
AUTO_REG_CF_URL=https://api.cf.example.com
SSO_LOGIN=true|false
SSO_OPTIONS=provider1,provider2
```

**UI Configuration:**
```bash
# Backend connection
BACKEND_URL=https://backend:443

# Customization
CONSOLE_TITLE=Stratos
CONSOLE_THEME=default|dark
```

### Configuration Files

**Backend Config (`config.properties`):**
```properties
# Database
DATABASE_PROVIDER=postgres
DATABASE_HOST=${DATABASE_HOST}
DATABASE_PORT=${DATABASE_PORT}
DATABASE_USER=${DATABASE_USER}
DATABASE_PASSWORD=${DATABASE_PASSWORD}
DATABASE_NAME=${DATABASE_NAME}

# Session
SESSION_STORE_SECRET=${SESSION_STORE_SECRET}

# Auth
UAA_ENDPOINT=https://uaa.example.com
CONSOLE_ADMIN_SCOPE=stratos.admin

# Plugins
AUTOSCALER_ENABLED=true
KUBERNETES_DASHBOARD_ENABLED=true
```

**Kubernetes ConfigMap:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: stratos-config
  namespace: stratos
data:
  config.properties: |
    DATABASE_PROVIDER=postgres
    LOG_LEVEL=info
    AUTO_REG_CF_URL=https://api.cf.example.com
```

**Kubernetes Secret:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: stratos-secrets
  namespace: stratos
type: Opaque
stringData:
  DATABASE_PASSWORD: changeme
  SESSION_STORE_SECRET: changeme
  ENCRYPTION_KEY: changeme
```

---

## 🔐 Security Hardening

### Pre-deployment audit

Before promoting a build to a production environment, run the audit
verbs from the source tree to inventory known CVEs in shipped
dependencies:

```bash
make audit summary     # high/moderate/low totals — fast triage
make audit             # full output: bun audit + gosec + trivy + govulncheck
make outdated          # direct deps with available upgrades
make deps dependabot   # open dependency PRs awaiting review (requires gh)
```

`make audit` does not gate the build — it surfaces findings for
operator judgement. Track which CVEs are reachable vs. transitive,
which fixes are available upstream, and which need a workstream
ticket. See `developer-environment.md` for tool installation.

### TLS/SSL Configuration

**Generate Certificates:**
```bash
# Self-signed (development only)
openssl req -x509 -newkey rsa:4096 \
  -keyout key.pem -out cert.pem \
  -days 365 -nodes \
  -subj "/CN=stratos.example.com"

# Production: Use cert-manager with Let's Encrypt
```

**Configure Ingress with cert-manager:**
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: stratos-tls
  namespace: stratos
spec:
  secretName: stratos-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - stratos.example.com
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: stratos-network-policy
  namespace: stratos
spec:
  podSelector:
    matchLabels:
      app: stratos
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: ingress-nginx
      ports:
        - protocol: TCP
          port: 443
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 443  # CF API, K8s API
```

### Pod Security Standards

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: stratos-backend
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: backend
      image: ghcr.io/cloudfoundry/stratos-backend:5.0.0
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
            - ALL
        readOnlyRootFilesystem: true
```

---

## 📊 Monitoring and Observability

### Prometheus Metrics

**ServiceMonitor:**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: stratos
  namespace: stratos
spec:
  selector:
    matchLabels:
      app: stratos
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
```

**Metrics Exposed:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `database_connections` - Active DB connections
- `session_count` - Active sessions
- `cf_api_calls_total` - CF API calls
- `k8s_api_calls_total` - K8s API calls

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Stratos Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)"
          }
        ]
      },
      {
        "title": "Active Sessions",
        "targets": [
          {
            "expr": "session_count"
          }
        ]
      }
    ]
  }
}
```

### Logging

**FluentD Configuration:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/stratos*.log
      pos_file /var/log/fluentd-stratos.pos
      tag stratos.*
      <parse>
        @type json
        time_key time
        time_format %Y-%m-%dT%H:%M:%S.%NZ
      </parse>
    </source>

    <filter stratos.**>
      @type parser
      key_name log
      <parse>
        @type json
      </parse>
    </filter>

    <match stratos.**>
      @type elasticsearch
      host elasticsearch
      port 9200
      index_name stratos
      type_name _doc
    </match>
```

### Health Checks

**Liveness Probe:**
```yaml
livenessProbe:
  httpGet:
    path: /pp/v1/info
    port: 443
    scheme: HTTPS
  initialDelaySeconds: 30
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 3
```

**Readiness Probe:**
```yaml
readinessProbe:
  httpGet:
    path: /pp/v1/info
    port: 443
    scheme: HTTPS
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

---

## 💾 Backup and Recovery

### Database Backup

**Automated Backup (CronJob):**
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: stratos-db-backup
  namespace: stratos
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:15
              env:
                - name: PGHOST
                  value: postgres
                - name: PGUSER
                  value: stratos
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: stratos-secrets
                      key: DATABASE_PASSWORD
              command:
                - /bin/sh
                - -c
                - |
                  BACKUP_FILE="/backup/stratos-$(date +%Y%m%d-%H%M%S).sql"
                  pg_dump stratos > "$BACKUP_FILE"
                  gzip "$BACKUP_FILE"

                  # Retain last 7 days
                  find /backup -name "stratos-*.sql.gz" -mtime +7 -delete
              volumeMounts:
                - name: backup-volume
                  mountPath: /backup
          restartPolicy: OnFailure
          volumes:
            - name: backup-volume
              persistentVolumeClaim:
                claimName: backup-pvc
```

**Manual Backup:**
```bash
# Backup database
kubectl -n stratos exec -it postgres-0 -- \
  pg_dump -U stratos stratos | gzip > backup-$(date +%Y%m%d).sql.gz

# Backup configuration
kubectl -n stratos get configmap stratos-config -o yaml > config-backup.yaml
kubectl -n stratos get secret stratos-secrets -o yaml > secrets-backup.yaml
```

### Restore Procedure

```bash
# 1. Stop Stratos
kubectl -n stratos scale deployment stratos-backend --replicas=0
kubectl -n stratos scale deployment stratos-ui --replicas=0

# 2. Restore database
gunzip < backup-20251106.sql.gz | \
  kubectl -n stratos exec -i postgres-0 -- \
  psql -U stratos stratos

# 3. Restore configuration (if needed)
kubectl apply -f config-backup.yaml
kubectl apply -f secrets-backup.yaml

# 4. Restart Stratos
kubectl -n stratos scale deployment stratos-backend --replicas=2
kubectl -n stratos scale deployment stratos-ui --replicas=2

# 5. Verify
kubectl -n stratos get pods
kubectl -n stratos logs -l app=stratos
```

---

## 📈 Scaling Strategies

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: stratos-backend-hpa
  namespace: stratos
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: stratos-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 80
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Database Scaling

**PostgreSQL High Availability:**
```yaml
# Use PostgreSQL operator (e.g., Zalando postgres-operator)
apiVersion: "acid.zalan.do/v1"
kind: postgresql
metadata:
  name: stratos-postgres
  namespace: stratos
spec:
  teamId: "stratos"
  volume:
    size: 100Gi
  numberOfInstances: 3
  users:
    stratos:
      - superuser
      - createdb
  databases:
    stratos: stratos
  postgresql:
    version: "15"
  resources:
    requests:
      cpu: 500m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 4Gi
```

---

## 🔧 Troubleshooting

See [troubleshooting.md](troubleshooting.md) for detailed troubleshooting guide.

**Quick Diagnostics:**
```bash
# Check pod status
kubectl -n stratos get pods

# View logs
kubectl -n stratos logs -l app=stratos --tail=100

# Describe pod
kubectl -n stratos describe pod stratos-backend-xxx

# Check events
kubectl -n stratos get events --sort-by='.lastTimestamp'

# Test connectivity
kubectl -n stratos run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl https://stratos-backend:443/pp/v1/info
```

---

## 📞 Support and Resources

### Documentation
- [Official Docs](https://stratos.app/docs)
- [Helm Chart](https://github.com/cloudfoundry/stratos/tree/master/deploy/kubernetes)
- [Troubleshooting Guide](troubleshooting.md)

### Community
- [GitHub Issues](https://github.com/cloudfoundry/stratos/issues)
- [GitHub Discussions](https://github.com/cloudfoundry/stratos/discussions)

---

**Last Updated:** 2025-11-06
**Version:** 1.0.0
**Maintained By:** DevOps Team
