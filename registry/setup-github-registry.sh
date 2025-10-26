#!/bin/bash

# Setup script for GitHub Container Registry (ghcr.io)
# GitHub provides free unlimited public container storage
# Private containers are included with GitHub subscription

set -e

echo "================================"
echo "GitHub Container Registry Setup"
echo "================================"
echo ""
echo "GitHub Container Registry (ghcr.io) is FREE and includes:"
echo "  - Unlimited public container storage"
echo "  - Private containers (with GitHub Pro/Team/Enterprise)"
echo "  - Integrated with GitHub Actions for CI/CD"
echo "  - No additional infrastructure needed"
echo ""

# Check if gh CLI is installed
if command -v gh &> /dev/null; then
    echo "✓ GitHub CLI (gh) is installed"
    if gh auth status &> /dev/null; then
        GITHUB_USER=$(gh api user -q .login)
        echo "✓ Authenticated as: $GITHUB_USER"
    else
        echo "⚠ Not authenticated with GitHub CLI"
        echo "Run: gh auth login"
    fi
else
    echo "⚠ GitHub CLI (gh) not installed (optional but recommended)"
    echo "Install from: https://cli.github.com/"
fi

echo ""
echo "================================"
echo "Setup Steps:"
echo "================================"
echo ""

echo "1. Create a Personal Access Token (PAT):"
echo "   a. Go to: https://github.com/settings/tokens"
echo "   b. Click 'Generate new token (classic)'"
echo "   c. Select scopes:"
echo "      - write:packages (required)"
echo "      - read:packages (required)"
echo "      - delete:packages (optional)"
echo "   d. Generate and SAVE the token securely"
echo ""

read -p "Enter your GitHub username: " GITHUB_USER
echo ""
echo "2. Login to GitHub Container Registry:"
echo ""
echo "   Run this command and paste your token when prompted:"
echo "   echo \$GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin"
echo ""
echo "   OR:"
echo "   docker login ghcr.io -u $GITHUB_USER"
echo "   Password: <paste your PAT>"
echo ""

read -p "Press Enter after you've logged in..."

# Test authentication
if docker login ghcr.io -u "$GITHUB_USER" --password-stdin < /dev/null 2>&1 | grep -q "Stored credentials invalid"; then
    echo ""
    echo "Let's login now:"
    docker login ghcr.io -u "$GITHUB_USER"
fi

echo ""
echo "================================"
echo "✓ GitHub Registry Setup Complete!"
echo "================================"
echo ""
echo "Your registry URL: ghcr.io/$GITHUB_USER"
echo ""
echo "Next steps:"
echo ""
echo "1. Build your image:"
echo "   docker build -t ghcr.io/$GITHUB_USER/industrial-automation-ui:latest ."
echo ""
echo "2. Push to GitHub:"
echo "   docker push ghcr.io/$GITHUB_USER/industrial-automation-ui:latest"
echo ""
echo "3. Make image public (optional):"
echo "   a. Go to: https://github.com/$GITHUB_USER?tab=packages"
echo "   b. Click on 'industrial-automation-ui'"
echo "   c. Package settings → Change visibility → Public"
echo ""
echo "4. Update Kubernetes deployment:"
echo "   Edit k8s/deployment.yaml:"
echo "   image: ghcr.io/$GITHUB_USER/industrial-automation-ui:latest"
echo ""
echo "5. If using private images, create Kubernetes secret:"
echo "   kubectl create secret docker-registry ghcr-secret \\"
echo "     --docker-server=ghcr.io \\"
echo "     --docker-username=$GITHUB_USER \\"
echo "     --docker-password=\$GITHUB_TOKEN \\"
echo "     -n automation"
echo ""
echo "   Then add to deployment.yaml:"
echo "   spec:"
echo "     imagePullSecrets:"
echo "       - name: ghcr-secret"
echo ""
echo "For CI/CD with GitHub Actions, see: registry/github-actions-example.yaml"
echo ""
