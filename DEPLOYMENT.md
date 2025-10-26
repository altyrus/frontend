# Kubernetes Deployment Guide

This guide covers deploying the Industrial Automation UI to an existing Kubernetes cluster.

## Prerequisites

- Docker installed on your build machine
- kubectl configured to access your Kubernetes cluster
- Access to a container registry (Docker Hub, GCR, ACR, ECR, etc.)
- Kubernetes cluster with:
  - Nginx Ingress Controller (or another ingress controller)
  - Optional: cert-manager for SSL certificates

## Quick Start

### 1. Configure Your Registry

Edit `scripts/build-and-push.sh` or set environment variables:

```bash
export REGISTRY="your-registry.example.com"  # Your container registry
export TAG="v1.0.0"  # Your image tag
```

Common registry formats:
- Docker Hub: `docker.io/username`
- Google GCR: `gcr.io/project-id`
- Azure ACR: `myregistry.azurecr.io`
- AWS ECR: `123456789.dkr.ecr.region.amazonaws.com`
- Harbor: `harbor.example.com/project`

### 2. Build and Push Docker Image

```bash
# Login to your registry first
docker login your-registry.example.com

# Build and push (using defaults from script)
./scripts/build-and-push.sh v1.0.0 your-registry.example.com

# Or build manually
docker build -t your-registry.example.com/industrial-automation-ui:v1.0.0 .
docker push your-registry.example.com/industrial-automation-ui:v1.0.0
```

### 3. Configure Kubernetes Manifests

Edit the following files in the `k8s/` directory:

#### k8s/deployment.yaml

Update the image reference:
```yaml
image: your-registry.example.com/industrial-automation-ui:v1.0.0
```

Update the ConfigMap with your endpoints:
```yaml
data:
  api-url: "http://your-automation-api:8080"
  mqtt-ws-url: "ws://your-mqtt-broker:9001"
```

#### k8s/ingress.yaml

Update the hostname:
```yaml
tls:
  - hosts:
    - automation.your-domain.com
    secretName: automation-ui-tls

rules:
  - host: automation.your-domain.com
```

### 4. Deploy to Kubernetes

```bash
# Check cluster connectivity
kubectl cluster-info

# Create namespace (optional)
kubectl create namespace automation

# Apply manifests
kubectl apply -f k8s/ -n automation

# Or use the deploy script
./scripts/deploy.sh automation
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n automation -l app=industrial-automation-ui

# Check service
kubectl get svc -n automation industrial-automation-ui

# Check ingress
kubectl get ingress -n automation industrial-automation-ui

# View logs
kubectl logs -f -n automation -l app=industrial-automation-ui
```

## Detailed Configuration

### Environment Variables

The application uses environment variables passed from the ConfigMap:

- `API_URL` - Backend API endpoint
- `MQTT_WS_URL` - MQTT WebSocket broker URL

These are injected into the nginx container and used for proxying.

### Resource Requirements

Default resource allocation per pod:

```yaml
requests:
  memory: "128Mi"
  cpu: "100m"
limits:
  memory: "256Mi"
  cpu: "500m"
```

Adjust based on your kiosk load:
- Low traffic (1-5 kiosks): Keep defaults
- Medium traffic (5-20 kiosks): Double the resources
- High traffic (20+ kiosks): Consider horizontal pod autoscaling

### Scaling

#### Manual Scaling

```bash
kubectl scale deployment industrial-automation-ui --replicas=3 -n automation
```

#### Horizontal Pod Autoscaler (HPA)

Create an HPA:
```bash
kubectl autoscale deployment industrial-automation-ui \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n automation
```

Or create `k8s/hpa.yaml`:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: industrial-automation-ui
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: industrial-automation-ui
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Ingress Configuration

#### Using Different Ingress Controllers

**Traefik:**
```yaml
spec:
  ingressClassName: traefik
  annotations:
    traefik.ingress.kubernetes.io/router.tls: "true"
```

**AWS ALB:**
```yaml
spec:
  ingressClassName: alb
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
```

**GCP:**
```yaml
spec:
  ingressClassName: gce
  annotations:
    kubernetes.io/ingress.global-static-ip-name: "automation-ui-ip"
```

#### SSL/TLS Certificates

**Using cert-manager (recommended):**

1. Install cert-manager in your cluster
2. Create a ClusterIssuer
3. Uncomment in ingress.yaml:
```yaml
cert-manager.io/cluster-issuer: "letsencrypt-prod"
```

**Using existing certificate:**

1. Create a TLS secret:
```bash
kubectl create secret tls automation-ui-tls \
  --cert=path/to/cert.crt \
  --key=path/to/cert.key \
  -n automation
```

2. Reference in ingress.yaml (already configured)

### Network Policies (Optional)

Create network policies to restrict traffic:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: industrial-automation-ui-policy
spec:
  podSelector:
    matchLabels:
      app: industrial-automation-ui
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 80
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: automation-api
    ports:
    - protocol: TCP
      port: 8080
  - to:
    - podSelector:
        matchLabels:
          app: mqtt-broker
    ports:
    - protocol: TCP
      port: 9001
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

## Testing

### Port Forward for Local Testing

```bash
kubectl port-forward -n automation svc/industrial-automation-ui 8080:80
```

Then access: http://localhost:8080/kiosk.html

### Health Checks

```bash
# Via port-forward
curl http://localhost:8080/health

# Via ingress
curl https://automation.your-domain.com/health
```

## Monitoring

### View Logs

```bash
# All pods
kubectl logs -f -n automation -l app=industrial-automation-ui

# Specific pod
kubectl logs -f -n automation industrial-automation-ui-xxxxx-xxxxx

# Previous container (if crashed)
kubectl logs -n automation industrial-automation-ui-xxxxx-xxxxx --previous
```

### Describe Resources

```bash
kubectl describe deployment industrial-automation-ui -n automation
kubectl describe pod industrial-automation-ui-xxxxx-xxxxx -n automation
kubectl describe ingress industrial-automation-ui -n automation
```

### Events

```bash
kubectl get events -n automation --sort-by='.lastTimestamp'
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl get pods -n automation

# Check events
kubectl describe pod <pod-name> -n automation

# Common issues:
# - ImagePullBackOff: Check registry credentials
# - CrashLoopBackOff: Check logs
# - Pending: Check resource availability
```

### Image Pull Errors

Create an image pull secret:

```bash
kubectl create secret docker-registry regcred \
  --docker-server=your-registry.example.com \
  --docker-username=your-username \
  --docker-password=your-password \
  --docker-email=your-email@example.com \
  -n automation
```

Add to deployment.yaml:
```yaml
spec:
  template:
    spec:
      imagePullSecrets:
      - name: regcred
```

### Ingress Not Working

```bash
# Check ingress controller is running
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl describe ingress industrial-automation-ui -n automation

# Check service endpoints
kubectl get endpoints industrial-automation-ui -n automation
```

### MQTT Connection Issues

1. Verify MQTT broker is accessible from pods:
```bash
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -n automation
# Inside the pod:
curl -v telnet://mqtt-broker:9001
```

2. Check ConfigMap values:
```bash
kubectl get configmap automation-config -n automation -o yaml
```

3. Verify WebSocket support in ingress annotations

## Rolling Updates

Update the image version:

```bash
# Method 1: Edit deployment
kubectl edit deployment industrial-automation-ui -n automation

# Method 2: Set image
kubectl set image deployment/industrial-automation-ui \
  industrial-automation-ui=your-registry.example.com/industrial-automation-ui:v1.0.1 \
  -n automation

# Watch rollout
kubectl rollout status deployment/industrial-automation-ui -n automation

# Rollback if needed
kubectl rollout undo deployment/industrial-automation-ui -n automation
```

## Cleanup

Remove all resources:

```bash
kubectl delete -f k8s/ -n automation

# Or delete namespace (removes everything)
kubectl delete namespace automation
```

## Production Checklist

- [ ] Image is pushed to production registry
- [ ] ConfigMap has correct API/MQTT endpoints
- [ ] Ingress hostname matches DNS
- [ ] SSL certificate is configured
- [ ] Resource limits are appropriate
- [ ] Health checks are passing
- [ ] Monitoring/logging is configured
- [ ] Network policies are in place (if required)
- [ ] Image pull secrets are configured (if using private registry)
- [ ] Backup/disaster recovery plan in place
- [ ] Scaling policies configured (HPA if needed)
- [ ] Documentation updated with production URLs

## Support

For issues or questions, refer to the main [README.md](README.md) or contact your DevOps team.
