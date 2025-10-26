# Environment Variables Setup

This document explains how to configure environment variables for the Industrial Automation UI project.

## Important Security Note

**NEVER commit sensitive credentials to git!**

- The `.env` file is excluded in `.gitignore`
- Always use `.env.example` as a template
- Never share your `.env` file or credentials publicly

## Setup Instructions

### 1. Create Your .env File

Copy the example file and fill in your actual values:

```bash
cp .env.example .env
```

### 2. Configure Your Credentials

Edit `.env` and replace the placeholder values:

```bash
# Application Configuration (for local development)
VITE_API_URL=http://localhost:8080/api
VITE_MQTT_BROKER_URL=ws://localhost:9001

# GitHub Container Registry Credentials
# Create token at: https://github.com/settings/tokens
# Required scopes: write:packages, read:packages
GITHUB_USERNAME=your-actual-username
GITHUB_TOKEN=ghp_your_actual_token_here

# Container Registry Configuration
REGISTRY=ghcr.io
IMAGE_NAME=industrial-automation-ui
IMAGE_TAG=latest

# Kubernetes Configuration
NAMESPACE=automation
```

## Environment Variables Reference

### Application Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API endpoint URL | `http://localhost:8080/api` | No |
| `VITE_MQTT_BROKER_URL` | MQTT broker WebSocket URL | `ws://localhost:9001` | No |

### GitHub Container Registry

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GITHUB_USERNAME` | Your GitHub username | `altyrus` | Yes* |
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_...` | Yes* |
| `REGISTRY` | Container registry host | `ghcr.io` | Yes* |

*Required only if pushing to GitHub Container Registry

### Build Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `IMAGE_NAME` | Docker image name | `industrial-automation-ui` | No |
| `IMAGE_TAG` | Docker image tag | `latest` | No |
| `NAMESPACE` | Kubernetes namespace | `automation` | No |

## How to Create a GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Industrial Automation UI")
4. Select scopes:
   - ✅ `write:packages` - Upload packages to GitHub Container Registry
   - ✅ `read:packages` - Download packages from GitHub Container Registry
   - ✅ `workflow` (optional) - Create/update GitHub Actions workflows
5. Click "Generate token"
6. **Copy the token immediately** - you won't be able to see it again!
7. Paste it into your `.env` file as `GITHUB_TOKEN`

## Using Environment Variables

### In Scripts

The build and deployment scripts automatically load `.env`:

```bash
# Build and push using .env values
./scripts/build-and-push.sh

# Deploy using .env values
./scripts/deploy.sh
```

### With Makefile

The Makefile supports loading from `.env`:

```bash
# Uses values from .env
make build-push
make deploy
```

### Manual Docker Commands

Load environment variables in your shell:

```bash
# Load all variables
export $(cat .env | grep -v '^#' | xargs)

# Now use them
docker login ${REGISTRY} -u ${GITHUB_USERNAME} -p ${GITHUB_TOKEN}
docker build -t ${REGISTRY}/${GITHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG} .
docker push ${REGISTRY}/${GITHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}
```

### In Kubernetes

For Kubernetes deployments, don't use `.env` directly. Instead:

1. **For public images** - No credentials needed
2. **For private images** - Create a Kubernetes secret:

```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=${GITHUB_USERNAME} \
  --docker-password=${GITHUB_TOKEN} \
  -n ${NAMESPACE}
```

Then reference in deployment:
```yaml
spec:
  imagePullSecrets:
    - name: ghcr-secret
```

## Development vs Production

### Development (.env)

```bash
VITE_API_URL=http://localhost:8080/api
VITE_MQTT_BROKER_URL=ws://localhost:9001
```

### Production (Kubernetes ConfigMap)

Edit `k8s/deployment.yaml`:
```yaml
data:
  api-url: "http://automation-api.production.svc.cluster.local:8080"
  mqtt-ws-url: "wss://mqtt.example.com:443"
```

## Troubleshooting

### Environment variables not loading

```bash
# Check if .env exists
ls -la .env

# Verify contents (be careful with output!)
cat .env | grep -v TOKEN | grep -v PASSWORD
```

### Docker login fails

```bash
# Test token manually
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# If it fails, regenerate your token with correct scopes
```

### Variables not available in scripts

```bash
# Make sure to source the .env file
source .env

# Or export them
export $(cat .env | grep -v '^#' | xargs)
```

## Best Practices

1. **Never commit .env** - It's in `.gitignore` for a reason
2. **Keep .env.example updated** - But with placeholder values only
3. **Rotate tokens regularly** - Regenerate tokens every 90 days
4. **Use minimal scopes** - Only grant necessary permissions
5. **Different tokens for different environments** - Dev, staging, production
6. **Store production secrets in secure vaults** - Use Kubernetes secrets, HashiCorp Vault, etc.

## CI/CD Integration

For GitHub Actions, use repository secrets instead of `.env`:

1. Go to: https://github.com/your-username/frontend/settings/secrets/actions
2. Add secrets:
   - `GHCR_USERNAME` - Your GitHub username
   - `GHCR_TOKEN` - Your Personal Access Token
3. Reference in workflow:
   ```yaml
   env:
     REGISTRY: ghcr.io
   steps:
     - uses: docker/login-action@v3
       with:
         registry: ${{ env.REGISTRY }}
         username: ${{ secrets.GHCR_USERNAME }}
         password: ${{ secrets.GHCR_TOKEN }}
   ```

## Quick Reference

```bash
# Setup
cp .env.example .env
nano .env  # Edit with your values

# Use with scripts
./scripts/build-and-push.sh

# Use with Make
make build-push

# Use manually
export $(cat .env | grep -v '^#' | xargs)
docker login ${REGISTRY} -u ${GITHUB_USERNAME} -p ${GITHUB_TOKEN}

# Check what's set (safely)
env | grep -E "GITHUB_USERNAME|REGISTRY|IMAGE_NAME|NAMESPACE"
```

## Security Checklist

- [ ] `.env` file created from `.env.example`
- [ ] Real credentials added to `.env`
- [ ] `.env` is in `.gitignore`
- [ ] `.env` never committed to git
- [ ] GitHub token has minimal required scopes
- [ ] Tokens rotated regularly
- [ ] Production secrets in Kubernetes secrets, not `.env`
- [ ] `.env.example` has no real credentials

## Support

For questions about environment configuration, see:
- [README.md](README.md) - Main documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [registry/REGISTRY-SETUP.md](registry/REGISTRY-SETUP.md) - Registry setup

**Remember: Keep your `.env` file secure and never share it!**
