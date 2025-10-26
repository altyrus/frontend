# Container Registry Setup Guide

You need a container registry to store your Docker images before deploying to Kubernetes. This guide covers multiple options from easiest to most advanced.

## Option 1: GitHub Container Registry (RECOMMENDED - FREE)

**Best for:** Most users, especially if already using GitHub

**Pros:**
- ✅ Completely FREE unlimited public storage
- ✅ No infrastructure to manage
- ✅ Integrated with GitHub
- ✅ Built-in CI/CD with GitHub Actions
- ✅ Private images included with GitHub Pro/Team

**Cons:**
- ❌ Requires GitHub account
- ❌ Tied to GitHub ecosystem

### Setup Steps

1. **Run the setup script:**
   ```bash
   cd registry
   ./setup-github-registry.sh
   ```

2. **Or manually:**

   a. Create Personal Access Token:
      - Go to: https://github.com/settings/tokens
      - Click "Generate new token (classic)"
      - Select scopes: `write:packages`, `read:packages`
      - Generate and save token

   b. Login to registry:
      ```bash
      export GITHUB_USER=your-github-username
      export GITHUB_TOKEN=your-personal-access-token

      echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin
      ```

   c. Build and push:
      ```bash
      docker build -t ghcr.io/$GITHUB_USER/industrial-automation-ui:latest .
      docker push ghcr.io/$GITHUB_USER/industrial-automation-ui:latest
      ```

   d. Make image public (optional):
      - Go to: https://github.com/$GITHUB_USER?tab=packages
      - Click on your package
      - Package settings → Change visibility → Public

3. **Update Kubernetes deployment:**
   ```yaml
   # k8s/deployment.yaml
   image: ghcr.io/your-github-username/industrial-automation-ui:latest
   ```

4. **For private images, create Kubernetes secret:**
   ```bash
   kubectl create secret docker-registry ghcr-secret \
     --docker-server=ghcr.io \
     --docker-username=$GITHUB_USER \
     --docker-password=$GITHUB_TOKEN \
     -n automation
   ```

   Add to deployment:
   ```yaml
   spec:
     imagePullSecrets:
       - name: ghcr-secret
   ```

### GitHub Actions CI/CD

The included workflow automatically builds and pushes on commits:

1. Copy workflow to your repo:
   ```bash
   mkdir -p .github/workflows
   cp registry/github-actions-example.yaml .github/workflows/build-and-push.yaml
   ```

2. Commit and push to GitHub:
   ```bash
   git add .github/workflows/
   git commit -m "Add container build workflow"
   git push
   ```

3. Images automatically build on:
   - Push to main/develop branches
   - Creating version tags (v1.0.0, v1.0.1, etc.)
   - Pull requests

---

## Option 2: Local Docker Registry

**Best for:** Development, testing, air-gapped environments

**Pros:**
- ✅ Complete control
- ✅ Fast for local development
- ✅ No external dependencies
- ✅ Works offline

**Cons:**
- ❌ Requires local infrastructure
- ❌ Self-signed certificates
- ❌ Manual backup/maintenance

### Setup Steps

1. **Run the setup script:**
   ```bash
   cd registry
   ./setup-local-registry.sh
   ```

   This will:
   - Create directories for data, auth, and certificates
   - Generate self-signed SSL certificate
   - Create authentication (username/password)
   - Start registry with web UI

2. **Trust the certificate:**

   **Linux:**
   ```bash
   sudo cp registry/certs/registry.crt /usr/local/share/ca-certificates/
   sudo update-ca-certificates
   sudo systemctl restart docker
   ```

   **macOS:**
   ```bash
   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain registry/certs/registry.crt
   ```

   **Or use insecure registry (not recommended for production):**
   Edit `/etc/docker/daemon.json`:
   ```json
   {
     "insecure-registries": ["localhost:5000"]
   }
   ```

3. **Access:**
   - Registry: `https://localhost:5000`
   - Web UI: `http://localhost:8080`

4. **Build and push:**
   ```bash
   docker login localhost:5000
   docker tag industrial-automation-ui:latest localhost:5000/industrial-automation-ui:latest
   docker push localhost:5000/industrial-automation-ui:latest
   ```

5. **For Kubernetes access:**

   If your Kubernetes cluster is on the same network:
   ```bash
   # Get your host IP
   HOST_IP=$(hostname -I | awk '{print $1}')

   # Update deployment
   image: $HOST_IP:5000/industrial-automation-ui:latest
   ```

### Management

```bash
cd registry

# Start registry
docker-compose up -d

# Stop registry
docker-compose down

# View logs
docker-compose logs -f

# Backup registry data
tar -czf registry-backup-$(date +%Y%m%d).tar.gz data/

# List all images
curl -k -u admin:password https://localhost:5000/v2/_catalog
```

---

## Option 3: Harbor on Kubernetes

**Best for:** Production, enterprises, teams requiring security scanning

**Pros:**
- ✅ Production-grade
- ✅ Built-in vulnerability scanning
- ✅ Image signing (Notary)
- ✅ Role-based access control
- ✅ Web UI for management
- ✅ Audit logs

**Cons:**
- ❌ Complex setup
- ❌ Requires significant resources (CPU/Memory/Storage)
- ❌ Needs cert-manager and ingress controller

### Prerequisites

- Kubernetes cluster with:
  - Ingress controller (nginx recommended)
  - cert-manager (for SSL certificates)
  - Storage class for persistent volumes
  - At least 4GB RAM available
  - 100GB+ storage

### Setup Steps

1. **Install cert-manager (if not already installed):**
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

2. **Run Harbor setup script:**
   ```bash
   cd registry
   ./setup-harbor-k8s.sh
   ```

   You'll be prompted for:
   - Namespace (default: harbor-system)
   - Domain name (e.g., harbor.yourdomain.com)
   - Admin password

3. **Access Harbor:**
   - URL: `https://harbor.yourdomain.com`
   - Username: `admin`
   - Password: `<your password>`

4. **Create project:**
   - Login to Harbor UI
   - Click "New Project"
   - Name: `automation`
   - Access Level: Public or Private

5. **Build and push:**
   ```bash
   docker login harbor.yourdomain.com
   docker tag industrial-automation-ui:latest harbor.yourdomain.com/automation/industrial-automation-ui:latest
   docker push harbor.yourdomain.com/automation/industrial-automation-ui:latest
   ```

6. **Update Kubernetes deployment:**
   ```yaml
   image: harbor.yourdomain.com/automation/industrial-automation-ui:latest
   ```

### Harbor Features

- **Vulnerability Scanning:** Automatically scans images for CVEs
- **Image Signing:** Sign images with Notary (optional)
- **Replication:** Mirror images to other registries
- **Webhooks:** Trigger actions on image push
- **Helm Charts:** Store Helm charts
- **RBAC:** Fine-grained access control

---

## Option 4: Cloud Provider Registries

### Docker Hub

**Free tier:** 1 private repo, unlimited public repos

```bash
docker login
docker tag industrial-automation-ui:latest your-username/industrial-automation-ui:latest
docker push your-username/industrial-automation-ui:latest
```

### Google Container Registry (GCR)

```bash
gcloud auth configure-docker
docker tag industrial-automation-ui:latest gcr.io/your-project/industrial-automation-ui:latest
docker push gcr.io/your-project/industrial-automation-ui:latest
```

### AWS Elastic Container Registry (ECR)

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag industrial-automation-ui:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/industrial-automation-ui:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/industrial-automation-ui:latest
```

### Azure Container Registry (ACR)

```bash
az acr login --name myregistry
docker tag industrial-automation-ui:latest myregistry.azurecr.io/industrial-automation-ui:latest
docker push myregistry.azurecr.io/industrial-automation-ui:latest
```

---

## Comparison Matrix

| Feature | GitHub | Local | Harbor | Docker Hub | Cloud |
|---------|--------|-------|--------|------------|-------|
| Cost | FREE | FREE | FREE | FREE/Paid | Paid |
| Setup Complexity | Easy | Easy | Hard | Easy | Medium |
| Vulnerability Scanning | ✅ | ❌ | ✅ | ✅ (paid) | ✅ |
| Web UI | ✅ | ✅ | ✅ | ✅ | ✅ |
| CI/CD Integration | ✅ | ❌ | ✅ | ✅ | ✅ |
| Private Images | ✅ | ✅ | ✅ | Limited | ✅ |
| Self-Hosted | ❌ | ✅ | ✅ | ❌ | ❌ |
| Offline Support | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## Recommendation by Use Case

### Personal Projects / Learning
→ **GitHub Container Registry**
- Free, easy, no infrastructure

### Development / Testing
→ **Local Docker Registry**
- Fast iteration, works offline

### Small Team / Startup
→ **GitHub Container Registry** or **Docker Hub**
- Low cost, integrated workflows

### Enterprise / Production
→ **Harbor on Kubernetes** or **Cloud Provider**
- Security scanning, compliance, support

### Air-Gapped / Offline
→ **Local Registry** or **Harbor**
- No internet dependency

---

## Troubleshooting

### Cannot push to registry

```bash
# Check if logged in
cat ~/.docker/config.json

# Re-login
docker logout <registry>
docker login <registry>
```

### Certificate errors

```bash
# For self-signed certs, trust them or use insecure-registry
# See local registry setup instructions
```

### Kubernetes cannot pull images

```bash
# Check if secret exists
kubectl get secrets -n automation

# Create pull secret
kubectl create secret docker-registry registry-secret \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password> \
  -n automation

# Add to deployment
spec:
  imagePullSecrets:
    - name: registry-secret
```

### Image pull authentication failed

```bash
# Test manual pull
docker pull <registry>/<image>:<tag>

# If that works, issue is with Kubernetes secret
# Recreate the secret with correct credentials
```

---

## Next Steps

After setting up your registry:

1. Build and push your image
2. Update [k8s/deployment.yaml](../k8s/deployment.yaml) with your registry URL
3. Follow [DEPLOYMENT.md](../DEPLOYMENT.md) to deploy to Kubernetes

For questions, see the main [README.md](../README.md)
