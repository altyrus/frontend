#!/bin/bash

# Setup script for local Docker registry
# This creates a self-contained Docker registry with authentication and UI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================"
echo "Docker Registry Setup"
echo "================================"
echo ""

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "ERROR: Docker Compose is not installed"
    exit 1
fi

if ! command -v openssl &> /dev/null; then
    echo "ERROR: OpenSSL is not installed"
    exit 1
fi

# Create directories
echo "Creating directories..."
mkdir -p data auth certs

# Generate self-signed certificate
echo ""
echo "Generating self-signed SSL certificate..."
if [ ! -f certs/registry.crt ]; then
    openssl req -newkey rsa:4096 -nodes -sha256 \
        -keyout certs/registry.key -x509 -days 365 \
        -out certs/registry.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,DNS:registry,IP:127.0.0.1"
    echo "✓ Certificate generated"
else
    echo "✓ Certificate already exists"
fi

# Create htpasswd file for authentication
echo ""
echo "Setting up authentication..."
read -p "Enter registry username [admin]: " USERNAME
USERNAME=${USERNAME:-admin}

if [ ! -f auth/htpasswd ]; then
    read -s -p "Enter registry password: " PASSWORD
    echo ""
    read -s -p "Confirm password: " PASSWORD_CONFIRM
    echo ""

    if [ "$PASSWORD" != "$PASSWORD_CONFIRM" ]; then
        echo "ERROR: Passwords do not match"
        exit 1
    fi

    # Create htpasswd file using docker
    docker run --rm --entrypoint htpasswd httpd:2 -Bbn "$USERNAME" "$PASSWORD" > auth/htpasswd
    echo "✓ Authentication configured"
else
    echo "✓ Authentication already configured"
fi

# Start registry
echo ""
echo "Starting Docker registry..."
docker-compose up -d

# Wait for registry to start
echo "Waiting for registry to start..."
sleep 5

# Check if registry is running
if docker ps | grep -q docker-registry; then
    echo ""
    echo "================================"
    echo "✓ Registry Setup Complete!"
    echo "================================"
    echo ""
    echo "Registry URL: https://localhost:5000"
    echo "Registry UI: http://localhost:8080"
    echo "Username: $USERNAME"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Trust the self-signed certificate:"
    echo "   sudo cp certs/registry.crt /usr/local/share/ca-certificates/registry.crt"
    echo "   sudo update-ca-certificates"
    echo ""
    echo "   OR for Docker Desktop (macOS/Windows):"
    echo "   - Add 'insecure-registries': ['localhost:5000'] to Docker daemon settings"
    echo ""
    echo "2. Login to registry:"
    echo "   docker login localhost:5000"
    echo "   Username: $USERNAME"
    echo "   Password: <your password>"
    echo ""
    echo "3. Tag and push your image:"
    echo "   docker tag industrial-automation-ui:latest localhost:5000/industrial-automation-ui:latest"
    echo "   docker push localhost:5000/industrial-automation-ui:latest"
    echo ""
    echo "4. View images in UI:"
    echo "   Open http://localhost:8080 in your browser"
    echo ""
    echo "To stop registry: docker-compose down"
    echo "To view logs: docker-compose logs -f"
    echo ""
else
    echo "ERROR: Registry failed to start"
    echo "Check logs with: docker-compose logs"
    exit 1
fi
