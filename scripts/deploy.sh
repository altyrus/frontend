#!/bin/bash

# Deploy to Kubernetes cluster
# Usage: ./scripts/deploy.sh [NAMESPACE]

set -e

NAMESPACE="${1:-default}"

echo "================================"
echo "Deploying to Kubernetes"
echo "================================"
echo "Namespace: ${NAMESPACE}"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl not found. Please install kubectl."
    exit 1
fi

# Check cluster connectivity
echo "Checking cluster connectivity..."
if ! kubectl cluster-info &> /dev/null; then
    echo "ERROR: Cannot connect to Kubernetes cluster."
    echo "Please check your kubeconfig and cluster connection."
    exit 1
fi

echo "Connected to cluster: $(kubectl config current-context)"
echo ""

# Create namespace if it doesn't exist
echo "Ensuring namespace exists..."
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "Applying Kubernetes manifests..."

# Apply ConfigMap first
kubectl apply -f k8s/deployment.yaml -n "${NAMESPACE}"

# Wait for deployment to be ready
echo ""
echo "Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s \
    deployment/industrial-automation-ui -n "${NAMESPACE}" || true

echo ""
echo "================================"
echo "Deployment Status"
echo "================================"
kubectl get pods -n "${NAMESPACE}" -l app=industrial-automation-ui
kubectl get svc -n "${NAMESPACE}" -l app=industrial-automation-ui

echo ""
echo "To view logs:"
echo "  kubectl logs -f -l app=industrial-automation-ui -n ${NAMESPACE}"
echo ""
echo "To port-forward (for testing):"
echo "  kubectl port-forward -n ${NAMESPACE} svc/industrial-automation-ui 8080:80"
echo ""
