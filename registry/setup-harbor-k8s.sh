#!/bin/bash

# Setup script for Harbor Registry on Kubernetes using Helm
# Harbor is a production-grade container registry with security scanning

set -e

echo "================================"
echo "Harbor Registry Setup (Kubernetes)"
echo "================================"
echo ""

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl is not installed"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    echo "ERROR: Helm is not installed"
    exit 1
fi

# Check cluster connectivity
if ! kubectl cluster-info &> /dev/null; then
    echo "ERROR: Cannot connect to Kubernetes cluster"
    exit 1
fi

echo "✓ kubectl installed"
echo "✓ helm installed"
echo "✓ Connected to cluster: $(kubectl config current-context)"
echo ""

# Get configuration
read -p "Enter namespace for Harbor [harbor-system]: " NAMESPACE
NAMESPACE=${NAMESPACE:-harbor-system}

read -p "Enter domain for Harbor [harbor.example.com]: " DOMAIN
DOMAIN=${DOMAIN:-harbor.example.com}

read -s -p "Enter admin password: " ADMIN_PASSWORD
echo ""
read -s -p "Confirm admin password: " ADMIN_PASSWORD_CONFIRM
echo ""

if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
    echo "ERROR: Passwords do not match"
    exit 1
fi

# Create namespace
echo ""
echo "Creating namespace..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Add Harbor Helm repo
echo "Adding Harbor Helm repository..."
helm repo add harbor https://helm.goharbor.io
helm repo update

# Create values file
echo ""
echo "Creating Harbor configuration..."
cat > /tmp/harbor-values.yaml <<EOF
expose:
  type: ingress
  tls:
    enabled: true
    certSource: auto
  ingress:
    hosts:
      core: ${DOMAIN}
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/proxy-body-size: "0"

externalURL: https://${DOMAIN}

harborAdminPassword: "${ADMIN_PASSWORD}"

persistence:
  enabled: true
  resourcePolicy: "keep"
  persistentVolumeClaim:
    registry:
      size: 100Gi
    chartmuseum:
      size: 5Gi
    jobservice:
      size: 1Gi
    database:
      size: 5Gi
    redis:
      size: 1Gi
    trivy:
      size: 5Gi

database:
  type: internal
  internal:
    password: "$(openssl rand -base64 32)"

chartmuseum:
  enabled: false

trivy:
  enabled: true

notary:
  enabled: false
EOF

# Install Harbor
echo ""
echo "Installing Harbor..."
helm upgrade --install harbor harbor/harbor \
  --namespace "$NAMESPACE" \
  --values /tmp/harbor-values.yaml \
  --wait \
  --timeout 10m

# Wait for Harbor to be ready
echo ""
echo "Waiting for Harbor to be ready..."
kubectl wait --for=condition=available --timeout=600s \
  deployment/harbor-core -n "$NAMESPACE" || true

echo ""
echo "================================"
echo "✓ Harbor Installation Complete!"
echo "================================"
echo ""
echo "Harbor URL: https://${DOMAIN}"
echo "Username: admin"
echo "Password: ${ADMIN_PASSWORD}"
echo ""
echo "Next steps:"
echo ""
echo "1. Access Harbor UI:"
echo "   https://${DOMAIN}"
echo ""
echo "2. Create a project (e.g., 'automation')"
echo ""
echo "3. Login to Harbor from Docker:"
echo "   docker login ${DOMAIN}"
echo "   Username: admin"
echo "   Password: ${ADMIN_PASSWORD}"
echo ""
echo "4. Tag and push your image:"
echo "   docker tag industrial-automation-ui:latest ${DOMAIN}/automation/industrial-automation-ui:latest"
echo "   docker push ${DOMAIN}/automation/industrial-automation-ui:latest"
echo ""
echo "5. Update Kubernetes deployment:"
echo "   image: ${DOMAIN}/automation/industrial-automation-ui:latest"
echo ""
echo "6. Create pull secret (if project is private):"
echo "   kubectl create secret docker-registry harbor-secret \\"
echo "     --docker-server=${DOMAIN} \\"
echo "     --docker-username=admin \\"
echo "     --docker-password=${ADMIN_PASSWORD} \\"
echo "     -n automation"
echo ""
echo "To uninstall: helm uninstall harbor -n ${NAMESPACE}"
echo "To view status: kubectl get all -n ${NAMESPACE}"
echo ""

# Clean up temp file
rm -f /tmp/harbor-values.yaml
