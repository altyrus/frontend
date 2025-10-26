#!/bin/bash

# Build and push Docker image to registry
# Usage: ./scripts/build-and-push.sh [TAG] [REGISTRY]

set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
IMAGE_NAME="${IMAGE_NAME:-industrial-automation-ui}"
TAG="${1:-${IMAGE_TAG:-latest}}"
REGISTRY="${2:-${REGISTRY:-localhost:5000}}"
FULL_IMAGE="${REGISTRY}/${GITHUB_USERNAME:-username}/${IMAGE_NAME}:${TAG}"

echo "================================"
echo "Building Docker Image"
echo "================================"
echo "Image: ${FULL_IMAGE}"
echo ""

# Build the Docker image
docker build -t "${IMAGE_NAME}:${TAG}" .

# Tag for registry
docker tag "${IMAGE_NAME}:${TAG}" "${FULL_IMAGE}"

echo ""
echo "================================"
echo "Pushing to Registry"
echo "================================"

# Push to registry
docker push "${FULL_IMAGE}"

echo ""
echo "================================"
echo "Build Complete!"
echo "================================"
echo "Image: ${FULL_IMAGE}"
echo ""
echo "To deploy to Kubernetes:"
echo "  1. Update k8s/deployment.yaml with image: ${FULL_IMAGE}"
echo "  2. Run: kubectl apply -f k8s/"
echo ""
