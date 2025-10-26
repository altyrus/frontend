# Kubernetes Deployment Checklist

This guide covers everything you need to know to deploy the Industrial Automation UI to your existing Kubernetes cluster.

## Prerequisites Checklist

### 1. Kubernetes Cluster Access

- [ ] **kubectl installed** on your machine
  ```bash
  kubectl version --client
  ```

- [ ] **kubectl configured** to access your cluster
  ```bash
  kubectl cluster-info
  kubectl get nodes
  ```

- [ ] **Cluster permissions** - You need to be able to:
  - Create namespaces
  - Create deployments, services, configmaps
  - Create ingress resources (if using ingress)
  - Create secrets (for private images)

### 2. Cluster Requirements

- [ ] **Kubernetes version**: 1.20+ recommended
  ```bash
  kubectl version --short
  ```

- [ ] **Available resources**:
  - At least 2 CPU cores available
  - At least 512MB RAM available per pod
  - Storage class for persistent volumes (if needed)

### 3. Networking Components

Check what's installed in your cluster:

```bash
# Check for ingress controller
kubectl get pods -n ingress-nginx
# OR
kubectl get ingressclass

# Check for load balancer support
kubectl get svc -A | grep LoadBalancer
```

**You need ONE of these:**

- [ ] **Ingress Controller** (recommended)
  - Nginx Ingress Controller (most common)
  - Traefik
  - HAProxy
  - Cloud provider ingress (ALB, GCE, etc.)

- [ ] **LoadBalancer Service** support
  - Cloud provider (AWS, GCP, Azure automatically provides)
  - MetalLB (for bare metal)
  - NodePort (fallback option)

- [ ] **Port Forwarding** (for testing only)
  - No additional requirements

### 4. Container Registry

Your container image is already pushed to:
```
ghcr.io/altyrus/industrial-automation-ui:latest
```

- [ ] **Public image** - No credentials needed ✅
- [ ] **Private image** - Need to create pull secret

Check if image is public:
```bash
# Try pulling without auth
docker pull ghcr.io/altyrus/industrial-automation-ui:latest
```

## Configuration Requirements

### 1. Backend Services Information

You need to know the URLs for:

**MQTT Broker:**
- [ ] MQTT broker URL/hostname
- [ ] WebSocket port (usually 9001)
- [ ] Protocol (ws:// or wss://)
- [ ] Example: `ws://mqtt-broker.default.svc.cluster.local:9001`

**Backend API:**
- [ ] API service URL/hostname
- [ ] API port (usually 8080)
- [ ] API endpoint path
- [ ] Example: `http://automation-api.default.svc.cluster.local:8080`

**If services are in the SAME cluster:**
```
Format: http://service-name.namespace.svc.cluster.local:port
Example: http://automation-api.automation.svc.cluster.local:8080
```

**If services are EXTERNAL:**
```
Format: http://external-hostname:port or https://external-hostname
Example: http://10.0.1.50:8080 or https://api.example.com
```

### 2. Domain Name (Optional - for Ingress)

- [ ] Domain name for the UI
- [ ] DNS configured to point to cluster ingress IP
- [ ] SSL certificate (or use cert-manager)

## Deployment Steps

### Step 1: Review and Update Configuration

#### A. Update ConfigMap with your endpoints

Edit `k8s/deployment.yaml` line 83-84:

```yaml
data:
  api-url: "http://YOUR-ACTUAL-API-URL:8080"
  mqtt-ws-url: "ws://YOUR-ACTUAL-MQTT-URL:9001"
```

**Examples:**

If MQTT and API are in the same cluster:
```yaml
data:
  api-url: "http://automation-api.automation.svc.cluster.local:8080"
  mqtt-ws-url: "ws://mqtt-broker.automation.svc.cluster.local:9001"
```

If MQTT and API are external:
```yaml
data:
  api-url: "http://192.168.1.100:8080"
  mqtt-ws-url: "ws://192.168.1.100:9001"
```

#### B. Choose Deployment Namespace

```bash
# Option 1: Use existing namespace
kubectl get namespaces

# Option 2: Create new namespace
kubectl create namespace automation
```

Update in `k8s/deployment.yaml` if needed, or use `-n` flag when deploying.

#### C. Verify Image URL

Check line 19 in `k8s/deployment.yaml`:
```yaml
image: ghcr.io/altyrus/industrial-automation-ui:latest
```

Should be correct already ✅

### Step 2: Deploy the Application

#### Option A: Simple Deployment (No Ingress)

```bash
# Create namespace
kubectl create namespace automation

# Deploy
kubectl apply -f k8s/deployment.yaml -n automation

# Verify
kubectl get pods -n automation
kubectl get svc -n automation
```

#### Option B: With Ingress

**Before deploying, update ingress configuration:**

Edit `k8s/ingress.yaml` line 21 and 25:
```yaml
hosts:
  - automation.yourdomain.com  # Change to your actual domain
```

**Check if you have cert-manager:**
```bash
kubectl get pods -n cert-manager
```

If NO cert-manager, comment out line 9 in `k8s/ingress.yaml`:
```yaml
# cert-manager.io/cluster-issuer: "letsencrypt-prod"
```

**Deploy with ingress:**
```bash
kubectl apply -f k8s/deployment.yaml -n automation
kubectl apply -f k8s/ingress.yaml -n automation
```

### Step 3: Verify Deployment

```bash
# Check pods are running
kubectl get pods -n automation -l app=industrial-automation-ui

# Expected output:
# NAME                                      READY   STATUS    RESTARTS   AGE
# industrial-automation-ui-xxxxx-xxxxx     1/1     Running   0          30s
# industrial-automation-ui-xxxxx-xxxxx     1/1     Running   0          30s

# Check service
kubectl get svc -n automation industrial-automation-ui

# Check logs
kubectl logs -f -n automation -l app=industrial-automation-ui
```

**Troubleshooting pods:**
```bash
# If pod is not running
kubectl describe pod <pod-name> -n automation

# Common issues:
# - ImagePullBackOff: Image can't be pulled
# - CrashLoopBackOff: Container is crashing
# - Pending: Not enough resources
```

### Step 4: Access the Application

#### Option 1: Port Forward (Quick Test)

```bash
kubectl port-forward -n automation svc/industrial-automation-ui 8080:80
```

Then open: http://localhost:8080/kiosk.html

#### Option 2: NodePort

Edit `k8s/deployment.yaml` service section (around line 62):
```yaml
spec:
  type: NodePort  # Change from ClusterIP
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080  # Choose port 30000-32767
```

Access via: http://NODE-IP:30080/kiosk.html

Get node IP:
```bash
kubectl get nodes -o wide
```

#### Option 3: LoadBalancer

Edit `k8s/deployment.yaml` service section:
```yaml
spec:
  type: LoadBalancer  # Change from ClusterIP
```

Get external IP:
```bash
kubectl get svc -n automation industrial-automation-ui
```

Wait for EXTERNAL-IP to be assigned, then access via:
http://EXTERNAL-IP/kiosk.html

#### Option 4: Ingress

```bash
# Get ingress IP
kubectl get ingress -n automation industrial-automation-ui

# Expected output:
# NAME                       CLASS   HOSTS                    ADDRESS         PORTS     AGE
# industrial-automation-ui   nginx   automation.example.com   192.168.1.100   80, 443   1m
```

Access via: https://automation.yourdomain.com/kiosk.html

## Common Scenarios

### Scenario 1: Everything in Same Cluster

Your MQTT broker and API are already running in Kubernetes:

**ConfigMap configuration:**
```yaml
data:
  api-url: "http://automation-api.default.svc.cluster.local:8080"
  mqtt-ws-url: "ws://mqtt-broker.default.svc.cluster.local:9001"
```

**DNS format:** `service-name.namespace.svc.cluster.local`

**Find your service names:**
```bash
kubectl get svc -A | grep -E 'mqtt|api'
```

### Scenario 2: MQTT/API Outside Cluster

Your MQTT broker and API are running on external servers:

**ConfigMap configuration:**
```yaml
data:
  api-url: "http://10.0.1.50:8080"
  mqtt-ws-url: "ws://10.0.1.50:9001"
```

**Network requirements:**
- Kubernetes pods can reach external IPs
- Firewall allows traffic from cluster to external services

### Scenario 3: Bare Metal / On-Premises

No cloud load balancer available:

**Options:**
1. Use **NodePort** - Access via node IP and port
2. Use **Ingress** with MetalLB for IP allocation
3. Use **Port Forward** for testing

### Scenario 4: Cloud Provider (AWS/GCP/Azure)

**Ingress:**
- AWS: ALB Ingress Controller
- GCP: GCE Ingress
- Azure: Application Gateway Ingress

**LoadBalancer:**
- Automatically creates cloud load balancer
- Gets external IP automatically

## Security Considerations

### 1. Image Pull Secrets (if image is private)

```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=altyrus \
  --docker-password=YOUR_GITHUB_TOKEN \
  -n automation
```

Add to deployment (after line 16):
```yaml
spec:
  imagePullSecrets:
    - name: ghcr-secret
  containers:
  ...
```

### 2. Network Policies (Optional)

Restrict traffic to/from the UI:

```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: industrial-automation-ui-policy
  namespace: automation
spec:
  podSelector:
    matchLabels:
      app: industrial-automation-ui
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: automation-api
  - to:
    - podSelector:
        matchLabels:
          app: mqtt-broker
  - ports:
    - port: 53
      protocol: UDP
EOF
```

### 3. TLS/SSL

**With Ingress and cert-manager:**
Already configured in `k8s/ingress.yaml`

**With existing certificate:**
```bash
kubectl create secret tls automation-ui-tls \
  --cert=path/to/cert.crt \
  --key=path/to/cert.key \
  -n automation
```

## Resource Limits

Default configuration (per pod):
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "500m"
```

**Adjust based on your needs:**
- Light usage (1-5 kiosks): Keep defaults
- Medium usage (5-20 kiosks): 2x the resources
- Heavy usage (20+ kiosks): Consider HPA

**Horizontal Pod Autoscaling:**
```bash
kubectl autoscale deployment industrial-automation-ui \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n automation
```

## Monitoring & Debugging

### Check Everything

```bash
# Full deployment status
kubectl get all -n automation

# Describe deployment
kubectl describe deployment industrial-automation-ui -n automation

# View pod logs
kubectl logs -f deployment/industrial-automation-ui -n automation

# Get events
kubectl get events -n automation --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n automation
```

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n automation
# Look for: Events section at bottom
```

**Can't pull image:**
```bash
# Check if image exists
docker pull ghcr.io/altyrus/industrial-automation-ui:latest

# Create pull secret if private
```

**Can't connect to MQTT/API:**
```bash
# Test from inside pod
kubectl exec -it <pod-name> -n automation -- sh
wget -O- http://automation-api.default.svc.cluster.local:8080
```

**Ingress not working:**
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl describe ingress industrial-automation-ui -n automation
```

## Pre-Deployment Checklist

Before running `kubectl apply`:

- [ ] ConfigMap has correct API and MQTT URLs
- [ ] Image URL is correct (ghcr.io/altyrus/...)
- [ ] Namespace exists or will be created
- [ ] Ingress domain is configured (if using ingress)
- [ ] DNS points to ingress IP (if using ingress)
- [ ] Pull secret created (if image is private)
- [ ] Resource limits are appropriate
- [ ] kubectl can access cluster
- [ ] You have permission to create resources

## Quick Start Commands

### Minimal Deployment (No Ingress)

```bash
# 1. Edit config
nano k8s/deployment.yaml
# Update lines 83-84 with your URLs

# 2. Deploy
kubectl create namespace automation
kubectl apply -f k8s/deployment.yaml -n automation

# 3. Test
kubectl port-forward -n automation svc/industrial-automation-ui 8080:80
# Open: http://localhost:8080/kiosk.html
```

### Full Deployment (With Ingress)

```bash
# 1. Edit configs
nano k8s/deployment.yaml  # Update lines 83-84
nano k8s/ingress.yaml     # Update lines 21 and 25

# 2. Deploy
kubectl create namespace automation
kubectl apply -f k8s/deployment.yaml -n automation
kubectl apply -f k8s/ingress.yaml -n automation

# 3. Check
kubectl get all,ingress -n automation
```

## What Information You Need

### From Your Infrastructure Team

1. **Kubernetes cluster endpoint** and credentials
2. **Namespace** to use (or permission to create)
3. **MQTT broker address** (hostname/IP and port)
4. **Backend API address** (hostname/IP and port)
5. **Ingress controller** type (if using ingress)
6. **Domain name** (if using ingress)
7. **Storage class** (only if adding persistence later)

### From Your Network Team

1. Can pods reach external services?
2. Any network policies to be aware of?
3. Firewall rules needed?
4. DNS configuration for ingress domain?

### From Your Security Team

1. Image security scanning requirements?
2. Network policy requirements?
3. Pod security standards?
4. Secret management approach?

## Next Steps After Deployment

1. **Monitor the application**
   ```bash
   kubectl logs -f -n automation -l app=industrial-automation-ui
   ```

2. **Test the kiosk interface**
   - Access via chosen method
   - Test equipment control buttons
   - Verify MQTT connection status
   - Check API connectivity

3. **Configure touchscreen kiosks**
   - Point browser to kiosk URL
   - Enable fullscreen mode
   - Lock down browser (see README.md)

4. **Set up monitoring** (optional)
   - Prometheus metrics
   - Grafana dashboards
   - Alert rules

## Support & Documentation

- **Main README**: [README.md](README.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Environment Setup**: [ENV-SETUP.md](ENV-SETUP.md)
- **Registry Setup**: [registry/REGISTRY-SETUP.md](registry/REGISTRY-SETUP.md)
- **This Checklist**: You are here!

## Quick Reference Card

```bash
# Deploy
kubectl apply -f k8s/deployment.yaml -n automation

# Check status
kubectl get pods -n automation

# View logs
kubectl logs -f -n automation -l app=industrial-automation-ui

# Port forward for testing
kubectl port-forward -n automation svc/industrial-automation-ui 8080:80

# Update deployment
kubectl rollout restart deployment/industrial-automation-ui -n automation

# Delete
kubectl delete -f k8s/ -n automation
```

---

**Ready to deploy?** Start with the Pre-Deployment Checklist above! 🚀
