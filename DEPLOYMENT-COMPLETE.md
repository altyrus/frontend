# Deployment Setup Complete! 🎉

Your Industrial Automation UI is now ready to deploy to Kubernetes.

## What We've Done

✅ Built touchscreen kiosk-optimized UI with ATM-style buttons
✅ Configured GitHub Container Registry
✅ Built Docker image
✅ Pushed image to ghcr.io/altyrus/industrial-automation-ui:latest
✅ Updated Kubernetes deployment manifests

## Your Container Image

**Registry:** GitHub Container Registry (ghcr.io)
**Image:** `ghcr.io/altyrus/industrial-automation-ui:latest`
**Status:** ✅ Pushed successfully

View your package: https://github.com/altyrus?tab=packages

## Next Steps to Deploy to Kubernetes

### 1. Configure Your Endpoints

Edit `k8s/deployment.yaml` and update the ConfigMap with your actual endpoints:

```yaml
# Line 83-84
data:
  api-url: "http://your-automation-api:8080"      # Your backend API
  mqtt-ws-url: "ws://your-mqtt-broker:9001"       # Your MQTT broker
```

### 2. Configure Ingress Domain (Optional)

If you want to expose the UI via a domain name, edit `k8s/ingress.yaml`:

```yaml
# Line 21 and 25
hosts:
  - automation.yourdomain.com    # Change to your domain
```

Or skip ingress and use port-forwarding or LoadBalancer service instead.

### 3. Deploy to Your Kubernetes Cluster

Make sure kubectl is configured to access your cluster:

```bash
# Check cluster connection
kubectl cluster-info

# Deploy the application
kubectl apply -f k8s/deployment.yaml -n automation

# If you configured ingress:
kubectl apply -f k8s/ingress.yaml -n automation
```

Or use the Makefile:

```bash
make deploy NAMESPACE=automation
```

Or use the deploy script:

```bash
./scripts/deploy.sh automation
```

### 4. Verify Deployment

```bash
# Check pods are running
kubectl get pods -n automation -l app=industrial-automation-ui

# Check service
kubectl get svc -n automation industrial-automation-ui

# View logs
kubectl logs -f -n automation -l app=industrial-automation-ui
```

### 5. Access Your Application

**Option A: Port Forward (for testing)**
```bash
kubectl port-forward -n automation svc/industrial-automation-ui 8080:80
```
Then access: http://localhost:8080/kiosk.html

**Option B: LoadBalancer (if supported)**
Edit `k8s/deployment.yaml` and change service type:
```yaml
spec:
  type: LoadBalancer  # Change from ClusterIP
```

**Option C: Ingress (if configured)**
Access via your configured domain: https://automation.yourdomain.com/kiosk.html

## For Private Images (Optional)

If you make your GitHub package private, create a Kubernetes secret:

```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=altyrus \
  --docker-password=YOUR_GITHUB_TOKEN \
  -n automation
```

Then add to deployment:
```yaml
spec:
  imagePullSecrets:
    - name: ghcr-secret
```

## Updating the Image

When you make changes to the code:

```bash
# 1. Build new image
docker build -t ghcr.io/altyrus/industrial-automation-ui:latest .

# 2. Push to registry
docker push ghcr.io/altyrus/industrial-automation-ui:latest

# 3. Restart Kubernetes deployment
kubectl rollout restart deployment/industrial-automation-ui -n automation
```

Or use the Makefile:
```bash
make build-push
make update-image NAMESPACE=automation
```

## Kiosk Mode Browser Settings

For production touchscreen kiosks, launch the browser with:

```bash
chromium-browser \
  --kiosk \
  --app=https://your-domain.com/kiosk.html \
  --start-fullscreen \
  --incognito \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --noerrdialogs
```

## Files Reference

- **Deployment manifests:** `k8s/deployment.yaml`
- **Ingress config:** `k8s/ingress.yaml`
- **Build script:** `scripts/build-and-push.sh`
- **Deploy script:** `scripts/deploy.sh`
- **Makefile:** `Makefile` (make help for commands)
- **Full deployment guide:** `DEPLOYMENT.md`
- **Registry setup guide:** `registry/REGISTRY-SETUP.md`

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n automation
kubectl logs <pod-name> -n automation
```

### Cannot pull image
Check if secret is configured (for private images):
```bash
kubectl get secrets -n automation
```

### Service not accessible
Check service endpoints:
```bash
kubectl get endpoints industrial-automation-ui -n automation
```

## Support

- Main README: `README.md`
- Deployment Guide: `DEPLOYMENT.md`
- Registry Guide: `registry/REGISTRY-SETUP.md`

---

**Your container is ready! Just configure your endpoints and deploy to Kubernetes.**
