#!/bin/bash

# Complete server cleanup and fresh setup script
set -e

echo "🧹 COMPLETE SERVER CLEANUP AND FRESH SETUP"
echo "=========================================="

# Stop and remove all containers
echo "🛑 Stopping all containers..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker system prune -af --volumes

# Remove all Docker images
echo "🗑️ Removing all Docker images..."
docker rmi $(docker images -q) 2>/dev/null || true

# Clean up directories
echo "📁 Cleaning directories..."
rm -rf /opt/citypulse
rm -rf /var/lib/docker/volumes/*
rm -rf /root/.docker

# Update system
echo "🔄 Updating system..."
apt-get update -y
apt-get upgrade -y

# Install essential packages
echo "📦 Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    jq \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common

# Install Docker (latest stable)
echo "🐳 Installing Docker..."
# Remove old Docker versions
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker service
systemctl enable docker
systemctl start docker

# Install Docker Compose (standalone - backup)
echo "🔧 Installing Docker Compose standalone..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p /opt/citypulse
chmod 755 /opt/citypulse

# Verify installations
echo "✅ Verifying installations..."
docker --version
docker compose version
docker-compose --version

echo ""
echo "✅ SERVER SETUP COMPLETE!"
echo "🐳 Docker: $(docker --version)"
echo "🔧 Docker Compose: $(docker compose version)"
echo "📁 Deployment directory: /opt/citypulse"
echo "👤 User: root"
echo ""
echo "Server is ready for deployment!"