#!/bin/bash

# Setup script to configure deploy user with proper permissions
# Run this once on the server to ensure consistent user setup

set -e

echo "🔧 Setting up deploy user with proper permissions..."

# Create deploy user if it doesn't exist
if ! id "deploy" &>/dev/null; then
    echo "👤 Creating deploy user..."
    sudo useradd -m -s /bin/bash deploy
    echo "✅ Deploy user created"
else
    echo "✅ Deploy user already exists"
fi

# Add deploy user to docker group
echo "🐳 Adding deploy user to docker group..."
sudo usermod -aG docker deploy

# Create and set permissions for deployment directory
echo "📁 Setting up deployment directory..."
sudo mkdir -p /opt/citypulse
sudo chown -R deploy:deploy /opt/citypulse
sudo chmod -R 755 /opt/citypulse

# Ensure deploy user can use sudo for specific docker commands (if needed)
echo "🔐 Setting up sudo permissions for deploy user..."
cat << 'EOF' | sudo tee /etc/sudoers.d/deploy-docker
deploy ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose, /usr/local/bin/docker-compose, /bin/mkdir, /bin/chown, /bin/chmod, /usr/bin/usermod
EOF

# Test docker access
echo "🧪 Testing docker access for deploy user..."
sudo -u deploy docker --version
sudo -u deploy docker compose version

# Set up SSH key directory for deploy user (if needed)
sudo mkdir -p /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chown -R deploy:deploy /home/deploy/.ssh

echo ""
echo "✅ Deploy user setup complete!"
echo "👤 User: deploy"
echo "🐳 Docker access: ✓"
echo "📁 Deployment directory: /opt/citypulse"
echo "🔐 Permissions: Configured"

# Display current status
echo ""
echo "📊 Current status:"
echo "Deploy user info: $(id deploy)"
echo "Docker group members: $(getent group docker)"
echo "Deployment directory ownership: $(ls -ld /opt/citypulse)"