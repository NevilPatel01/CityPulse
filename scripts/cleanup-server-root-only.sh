#!/bin/bash

# Server cleanup script - Use ROOT user only
# This script removes deploy user and sets all ownership to root

set -e

echo "🧹 Cleaning up server to use ROOT user only..."

# Stop all running containers first
echo "🛑 Stopping all containers..."
cd /opt/citypulse
docker compose -f docker-compose.prod.yml down --remove-orphans || true

# Remove deploy user and transfer ownership to root
echo "👤 Removing deploy user and transferring ownership to root..."

# Change ownership of all files to root
chown -R root:root /opt/citypulse
chown -R root:root /opt/citypulse/* 2>/dev/null || true

# Remove deploy user (if exists)
if id "deploy" &>/dev/null; then
    echo "🗑️  Removing deploy user..."
    userdel -r deploy 2>/dev/null || true
    echo "✅ Deploy user removed"
else
    echo "✅ Deploy user doesn't exist"
fi

# Remove deploy user from sudoers
rm -f /etc/sudoers.d/deploy-docker

# Set proper permissions for root
echo "🔐 Setting permissions for root user..."
chmod -R 755 /opt/citypulse
chown -R root:root /opt/citypulse

# Clean up any leftover files from deploy user
echo "🧽 Cleaning up leftover files..."
find /opt/citypulse -user 1001 -exec chown root:root {} \; 2>/dev/null || true
find /opt/citypulse -group 1001 -exec chown root:root {} \; 2>/dev/null || true

# Ensure Docker is accessible by root
echo "🐳 Verifying Docker access for root..."
docker --version
docker compose version

# Display current status
echo ""
echo "✅ Server cleanup complete!"
echo "👤 User: root only"
echo "🐳 Docker access: ✓"
echo "📁 Deployment directory: /opt/citypulse"

echo ""
echo "📊 Current ownership status:"
ls -la /opt/citypulse

echo ""
echo "🔄 Restarting containers with root ownership..."
cd /opt/citypulse
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ All services running under root user!"
docker compose -f docker-compose.prod.yml ps